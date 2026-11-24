import React from "react";
import { Modal } from "react-native";
import { playDolphinChirp, playDolphinWhistle } from "../audio/dolphinAudio";
import { getCurrentTourStep } from "../tour/villageTourService";
import { MobileDetectiveGame } from "../../../Gametrinhtham/MobileDetectiveGame";

interface DetectiveWebViewModalProps {
  visible: boolean;
  onClose: () => void;
  caseId?: string;
}

/** Player-facing detective entry. React Native mobile UI only; no iframe/WebView. */
export function DetectiveWebViewModal({ visible, onClose, caseId }: DetectiveWebViewModalProps) {
  const handleClose = () => {
    playDolphinChirp(0.3);
    const tourStep = getCurrentTourStep();
    if (tourStep === "detective_modal" || tourStep === "world_detective_lore" || tourStep === "detective") {
      playDolphinWhistle(0.4);
    }
    onClose();
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <MobileDetectiveGame onClose={handleClose} initialCaseId={caseId} />
    </Modal>
  );
}
