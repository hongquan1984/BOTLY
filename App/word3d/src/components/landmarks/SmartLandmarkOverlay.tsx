import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { LoadedBuilding } from '../../systems/cozyVillageLayoutLoader';

export interface SmartLandmarkOverlayProps {
  camera: THREE.Camera | null;
  buildings: LoadedBuilding[];
  selectedLandmarkId: string | null;
  arrivedBuilding: LoadedBuilding | null;
  onSelectLandmark: (building: LoadedBuilding) => void;
  onEnterBuilding: (building: LoadedBuilding) => void;
  onDismissArrival?: () => void;
  language?: 'vi' | 'en';
}

export const SmartLandmarkOverlay: React.FC<SmartLandmarkOverlayProps> = ({
  camera,
  buildings,
  selectedLandmarkId,
  arrivedBuilding,
  onSelectLandmark,
  onEnterBuilding,
  onDismissArrival,
  language = 'vi',
}) => {
  const badgeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Filter functional buildings & deduplicate by buildingInstanceId
  const activeLandmarks = useMemo(() => {
    const seen = new Set<string>();
    return buildings.filter((b) => {
      const id = b.config.buildingInstanceId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return (b.config.hasFunction || b.config.landmarkId) && b.config.enabled !== false;
    });
  }, [buildings]);

  // Helper to test if a building is focused or highlighted
  const checkIsFocused = (cfg: any, id: string): boolean => {
    if (!selectedLandmarkId) return false;
    return (
      selectedLandmarkId === cfg.landmarkId ||
      selectedLandmarkId === id ||
      (selectedLandmarkId === 'village_square' && (id === 'bld_plaza_well' || cfg.landmarkId === 'task_square')) ||
      (selectedLandmarkId === 'task_square' && (id === 'bld_plaza_well' || cfg.landmarkId === 'village_square')) ||
      (selectedLandmarkId === 'herbal_house' && (id === 'bld_potion_shop' || cfg.landmarkId === 'herbal_garden')) ||
      (selectedLandmarkId === 'herbal_garden' && (id === 'bld_potion_shop' || cfg.landmarkId === 'herbal_garden')) ||
      (selectedLandmarkId === 'body_science_house' && (id === 'bld_bookshop' || cfg.landmarkId === 'knowledge_library')) ||
      (selectedLandmarkId === 'knowledge_library' && (id === 'bld_bookshop' || cfg.landmarkId === 'knowledge_library')) ||
      (selectedLandmarkId === 'journey_house' && (id === 'bld_great_hall' || cfg.landmarkId === 'journey_house')) ||
      (selectedLandmarkId === 'detective_office' && (id === 'bld_watermill' || cfg.landmarkId === 'cloud_therapy')) ||
      (selectedLandmarkId === 'cloud_therapy' && (id === 'bld_watermill' || cfg.landmarkId === 'cloud_therapy'))
    );
  };

  useEffect(() => {
    let animId: number | null = null;
    let isRunning = true;
    const tempVec = new THREE.Vector3();

    const update = () => {
      if (!isRunning || document.hidden) {
        animId = null;
        return;
      }
      animId = requestAnimationFrame(update);
      if (!camera) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const camPos = camera.position;

      for (const bld of activeLandmarks) {
        const id = bld.config.buildingInstanceId;
        const el = badgeRefs.current.get(id);
        if (!el) continue;

        const worldAnchor = bld.getLabelWorldAnchor();
        tempVec.copy(worldAnchor);

        const distance = camPos.distanceTo(worldAnchor);
        tempVec.project(camera);

        const isBehind = tempVec.z > 1.0;
        const screenX = (tempVec.x * 0.5 + 0.5) * width;
        const screenY = (-(tempVec.y * 0.5) + 0.5) * height;

        const inBounds =
          !isBehind &&
          screenX >= 20 &&
          screenX <= width - 20 &&
          screenY >= 20 &&
          screenY <= height - 60;

        if (!inBounds) {
          el.style.display = 'none';
        } else {
          el.style.display = 'block';
          el.style.left = `${screenX}px`;
          el.style.top = `${screenY}px`;

          const isFocused =
            Boolean(selectedLandmarkId) &&
            (selectedLandmarkId === bld.config.landmarkId ||
              selectedLandmarkId === id ||
              (selectedLandmarkId === 'village_square' && (id === 'bld_plaza_well' || bld.config.landmarkId === 'task_square')) ||
              (selectedLandmarkId === 'task_square' && (id === 'bld_plaza_well' || bld.config.landmarkId === 'village_square')) ||
              (selectedLandmarkId === 'herbal_house' && (id === 'bld_potion_shop' || bld.config.landmarkId === 'herbal_garden')) ||
              (selectedLandmarkId === 'herbal_garden' && (id === 'bld_potion_shop' || bld.config.landmarkId === 'herbal_garden')) ||
              (selectedLandmarkId === 'body_science_house' && (id === 'bld_bookshop' || bld.config.landmarkId === 'knowledge_library')) ||
              (selectedLandmarkId === 'knowledge_library' && (id === 'bld_bookshop' || bld.config.landmarkId === 'knowledge_library')) ||
              (selectedLandmarkId === 'journey_house' && (id === 'bld_great_hall' || bld.config.landmarkId === 'journey_house')) ||
              (selectedLandmarkId === 'detective_office' && (id === 'bld_watermill' || bld.config.landmarkId === 'cloud_therapy')) ||
              (selectedLandmarkId === 'cloud_therapy' && (id === 'bld_watermill' || bld.config.landmarkId === 'cloud_therapy')));

          el.style.zIndex = isFocused ? '500' : '30';

          // Adaptive zoom: < 26m show name, > 26m show compact icon (unless focused)
          const nameSpan = el.querySelector('.landmark-name-container') as HTMLElement;
          if (nameSpan) {
            nameSpan.style.display = distance < 26 || isFocused ? 'flex' : 'none';
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else {
        if (animId === null && isRunning) {
          update();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    update();

    return () => {
      isRunning = false;
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [camera, activeLandmarks, selectedLandmarkId]);

  return (
    <div
      className="smart-landmarks-container"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 30,
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes pulseGlowBeacon {
          0% {
            transform: scale(1.08);
            box-shadow: 0 0 20px rgba(52, 211, 153, 0.8), 0 0 35px rgba(251, 191, 36, 0.6);
            border-color: #34d399;
          }
          50% {
            transform: scale(1.24);
            box-shadow: 0 0 45px rgba(52, 211, 153, 1), 0 0 75px rgba(251, 191, 36, 0.95), 0 0 95px rgba(56, 189, 248, 0.9);
            border-color: #fbbf24;
          }
          100% {
            transform: scale(1.08);
            box-shadow: 0 0 20px rgba(52, 211, 153, 0.8), 0 0 35px rgba(251, 191, 36, 0.6);
            border-color: #34d399;
          }
        }
        @keyframes pulseBeaconRing {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.4);
            opacity: 0;
          }
        }
        @keyframes bounceDownArrow {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(6px);
          }
        }
      `}</style>
      {/* 2D Overhead Landmark Badges */}
      {activeLandmarks.map((bld) => {
        const cfg = bld.config;
        const id = cfg.buildingInstanceId;
        const displayName = cfg.displayName[language] || cfg.displayName.vi;
        const icon = cfg.iconId || '🏛️';
        const isFocused = checkIsFocused(cfg, id);

        return (
          <div
            key={id}
            ref={(node) => {
              if (node) badgeRefs.current.set(id, node);
              else badgeRefs.current.delete(id);
            }}
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'auto',
              cursor: 'pointer',
              display: 'none', // Managed by update loop
              filter: isFocused
                ? 'drop-shadow(0 0 18px rgba(251, 191, 36, 0.95))'
                : 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45))',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isFocused) {
                // If already focused / highlighted, tapping enters the building directly!
                onEnterBuilding(bld);
              } else {
                onSelectLandmark(bld);
              }
            }}
          >
            {/* Glowing Beacon Expansion Ring */}
            {isFocused && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(52,211,153,0.45) 45%, rgba(56,189,248,0.2) 70%, transparent 85%)',
                  animation: 'pulseBeaconRing 1.3s infinite ease-out',
                  pointerEvents: 'none',
                  zIndex: -1,
                }}
              />
            )}

            {/* Horizontal Badge Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isFocused ? '6px 14px 6px 8px' : '4px 10px 4px 6px',
                borderRadius: '999px',
                background: isFocused
                  ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.98), rgba(16, 185, 129, 0.95))'
                  : 'rgba(15, 23, 42, 0.88)',
                border: isFocused
                  ? '2.5px solid #fbbf24'
                  : '1.5px solid rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: isFocused
                  ? '0 0 30px rgba(251, 191, 36, 0.85), 0 0 50px rgba(52, 211, 153, 0.6)'
                  : '0 4px 12px rgba(0, 0, 0, 0.4)',
                transform: isFocused ? 'scale(1.15)' : 'scale(1.0)',
                animation: isFocused ? 'pulseGlowBeacon 1.2s infinite ease-in-out' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.18)';
                e.currentTarget.style.borderColor = '#fbbf24';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isFocused ? 'scale(1.15)' : 'scale(1.0)';
                e.currentTarget.style.borderColor = isFocused
                  ? '#fbbf24'
                  : 'rgba(255, 255, 255, 0.22)';
              }}
            >
              {/* Icon Circle */}
              <div
                style={{
                  width: isFocused ? '28px' : '24px',
                  height: isFocused ? '28px' : '24px',
                  borderRadius: '50%',
                  background: isFocused ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isFocused ? '16px' : '14px',
                  flexShrink: 0,
                  boxShadow: isFocused ? '0 0 10px #fbbf24' : 'none',
                }}
              >
                {icon}
              </div>

              {/* Title Text */}
              <div
                className="landmark-name-container"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  lineHeight: 1.15,
                }}
              >
                <span
                  style={{
                    fontSize: isFocused ? '13px' : '12px',
                    fontWeight: 800,
                    color: isFocused ? '#ffffff' : '#f8fafc',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px',
                    textShadow: isFocused ? '0 0 8px rgba(251, 191, 36, 0.8)' : '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {displayName}
                </span>
                {isFocused && (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#fef08a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    ✨ Điểm Khám Phá
                  </span>
                )}
              </div>
            </div>

            {/* Downward Bouncing Indicator Arrow */}
            {isFocused ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'bounceDownArrow 0.8s infinite alternate ease-in-out',
                  marginTop: '2px',
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '8px solid #fbbf24',
                    filter: 'drop-shadow(0 0 6px #fbbf24)',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgba(15, 23, 42, 0.88)',
                  margin: '0 auto',
                }}
              />
            )}
          </div>
        );
      })}

      {/* Arrival Card Prompt: "Đã đến [Tên Nhà] - Vào Nhà" */}
      {arrivedBuilding && (
        <div
          className="landmark-arrival-card"
          style={{
            position: 'absolute',
            bottom: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            zIndex: 60,
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(6, 44, 30, 0.96), rgba(15, 23, 42, 0.98))',
              border: '2px solid #34d399',
              borderRadius: '20px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65), 0 0 20px rgba(52, 211, 153, 0.35)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              maxWidth: '90vw',
              minWidth: '280px',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(52, 211, 153, 0.2)',
                border: '1.5px solid rgba(52, 211, 153, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0,
              }}
            >
              {arrivedBuilding.config.iconId || '🏛️'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#34d399',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                📍 Đã Đến Nơi
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '1px',
                }}
              >
                {arrivedBuilding.config.displayName[language] || arrivedBuilding.config.displayName.vi}
              </div>
              {arrivedBuilding.config.descriptionVi && (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '2px',
                    lineHeight: 1.25,
                  }}
                >
                  {arrivedBuilding.config.descriptionVi}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onEnterBuilding(arrivedBuilding)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  whiteSpace: 'nowrap',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              >
                🚪 Vào
              </button>

              {onDismissArrival && (
                <button
                  onClick={onDismissArrival}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    color: '#94a3b8',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Đóng"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
};
