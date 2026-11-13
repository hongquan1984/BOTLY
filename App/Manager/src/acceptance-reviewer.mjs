import {requiresVisual} from './evidence-verifier.mjs';
export function reviewResult(task,result,evidence,aiDecision){
 if(result.status==='BLOCKED')return {decision:'BLOCKED',feedback:result.blockers,dimensions:{functional:'BLOCKED'}};
 if(result.status!=='READY_FOR_REVIEW')return {decision:'REWORK',feedback:['Developer result is not ready for review.'],dimensions:{functional:'REWORK'}};
 if(!evidence.ok)return {decision:'REWORK',feedback:evidence.issues,dimensions:{functional:'UNVERIFIED',visual:task.visualEvidence.length?'UNVERIFIED':'NOT_APPLICABLE'}};
 if(requiresVisual(task)&&evidence.visual==='UNVERIFIED')return {decision:'REWORK',feedback:['VISUAL_REVIEW_UNVERIFIED: required screenshot is missing or not reviewable with measured dimensions.'],dimensions:{visual:'UNVERIFIED'}};
 if(!aiDecision||!['PASS','REWORK','BLOCKED','NEEDS_APPROVAL'].includes(aiDecision.decision))return {decision:'REWORK',feedback:['Manager decision missing/invalid.'],dimensions:{functional:'UNVERIFIED'}};
 if(aiDecision.decision==='PASS'&&requiresVisual(task)&&aiDecision.dimensions?.visual!=='PASS')return {decision:'REWORK',feedback:['Manager did not independently inspect all required screenshots and verify the visual criteria as PASS.'],dimensions:aiDecision.dimensions};
 const auditOnly=task.acceptanceCriteria.some(x=>/no product files changed/i.test(x));
 if(aiDecision.decision==='PASS'&&!auditOnly&&Object.values(aiDecision.dimensions||{}).some(x=>['REWORK','BLOCKED','UNVERIFIED'].includes(x)))return {decision:'REWORK',feedback:['Decision PASS conflicts with a failed or unverified implementation acceptance dimension.'],dimensions:aiDecision.dimensions};
 return aiDecision;
}
