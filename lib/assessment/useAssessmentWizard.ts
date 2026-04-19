'use client';
import { useMemo, useRef, useState } from 'react';
import { branches, getStaffBranch } from './constants';
import { checkDuplicateSubmission } from './services/checkDuplicateSubmission';
import { buildSubmissionPayload } from './services/submitPayload';
import type { WizardStep } from './types';
import useAutoHeight from './hooks/useAutoHeight';
import useContactUsageCheck from './hooks/useContactUsageCheck';
import useStaffOptions from './hooks/useStaffOptions';
import useWizardFormState from './hooks/useWizardFormState';
import { getStepValidationError, shouldShowStepValidation } from './validation';
const isAbortError = (error: unknown) =>
  (error instanceof DOMException && error.name === 'AbortError')
  || (error instanceof Error && /abort/i.test(error.message));
export default function useAssessmentWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateBranch, setDuplicateBranch] = useState<string | null>(null);
  const submitIntentRef = useRef(false);
  const cardContentRef = useRef<HTMLDivElement | null>(null);
  const cardHeight = useAutoHeight(cardContentRef);
  const formState = useWizardFormState();
  const {
    preferredBranch,
    setStatusMessage,
    setStatusKind,
    referredByStaff,
    referredStaffId,
    setReferredStaffId,
    clearStoredDraft,
    resetForm,
  } = formState;
  const isValid = useMemo(
    () => branches.includes(preferredBranch as (typeof branches)[number]),
    [preferredBranch],
  );
  const staffBranch = useMemo(() => getStaffBranch(preferredBranch), [preferredBranch]);
  const isStaffRequired = referredByStaff === 'yes' && !!staffBranch;
  const { staffOptions, staffLoading } = useStaffOptions({
    preferredBranch,
    referredByStaff,
    staffBranch,
    setReferredStaffId,
  });
  const shouldShowStaff = referredByStaff === 'yes' && !!staffBranch;
  const effectiveStaffOptions = shouldShowStaff ? staffOptions : [];
  const effectiveStaffLoading = shouldShowStaff ? staffLoading : false;
  const {
    isCheckingContactUsage,
    emailAlreadyUsed,
    mobileAlreadyUsed,
    contactUsageError,
    retryContactUsageCheck,
    resetContactUsage,
  } = useContactUsageCheck({
    step,
    emailAddress: formState.emailAddress,
    mobileNumber: formState.mobileNumber,
  });
  const validationError = getStepValidationError(step, formState, { isStaffRequired });
  const hasContactConflict = step === 2 && (emailAlreadyUsed || mobileAlreadyUsed);
  const isStepValid = validationError === null && !hasContactConflict && !(step === 2 && isCheckingContactUsage);
  const showStepValidation = shouldShowStepValidation(step, formState, { isStaffRequired });
  const goToNextStep = async () => {
    if (step === 2 && contactUsageError) {
      const retrySucceeded = await retryContactUsageCheck();
      if (!retrySucceeded) {
        setStatusKind('error');
        setStatusMessage(contactUsageError);
        return;
      }
      setStatusKind(null);
      setStatusMessage(null);
      return;
    }
    if (!isStepValid) return;
    if (step === 2) {
      let duplicateResult;
      try {
        duplicateResult = await checkDuplicateSubmission(formState.fullName, formState.dateOfBirth);
      } catch (err) {
        setStatusKind('error');
        const fallbackMessage = 'Something went wrong. Please try again.';
        const errorMessage =
          err instanceof Error && err.message.trim().length > 0
            ? err.message
            : fallbackMessage;
        setStatusMessage(errorMessage);
        return;
      }
      if (duplicateResult.exists) {
        setDuplicateBranch(duplicateResult.branch);
        setIsDuplicateModalOpen(true);
        return;
      }
    }
    setStep((current) => (current < 6 ? ((current + 1) as WizardStep) : current));
  };
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step !== 6) {
      await goToNextStep();
      return;
    }
    if (!submitIntentRef.current) {
      return;
    }
    submitIntentRef.current = false;
    if (!isStepValid) return;
    if (!isValid) {
      return;
    }
    if (isStaffRequired && !referredStaffId) {
      return;
    }
    formState.setIsSubmitting(true);
    setStatusKind(null);
    setStatusMessage(null);
    try {
      const formElement = event.currentTarget;
      const payload = buildSubmissionPayload({
        currentLocation: formState.currentLocation,
        preferredBranch,
        referredByStaff,
        referredStaffId,
        staffBranch,
        staffOptions: effectiveStaffOptions,
        fullName: formState.fullName,
        mobileNumber: formState.mobileNumber,
        emailAddress: formState.emailAddress,
        dateOfBirth: formState.dateOfBirth,
        isUsPassportHolder: formState.isUsPassportHolder,
        highestEducationalAttainment: formState.highestEducationalAttainment,
        englishTest: formState.englishTest,
        hasWorked: formState.hasWorked,
        hasVisaRefusal: formState.hasVisaRefusal,
        studyDestinations: formState.studyDestinations,
        otherStudyDestination: formState.otherStudyDestination,
        preferredCoursesOfStudy: formState.preferredCoursesOfStudy,
        otherPreferredCourseOfStudy: formState.otherPreferredCourseOfStudy,
        plannedStudyStart: formState.plannedStudyStart,
        preferredConsultationMethod: formState.preferredConsultationMethod,
        preferredConsultationDate: formState.preferredConsultationDate,
        preferredConsultationTime: formState.preferredConsultationTime,
        discoverySources: formState.discoverySources,
        otherDiscoverySource: formState.otherDiscoverySource,
        referralCode: formState.referralCode,
        resumeFile: formState.resumeFile,
      });
      const submittedFormData = new FormData(formElement);
      const rawTurnstileToken = submittedFormData.get('cf-turnstile-response');
      const turnstileToken = typeof rawTurnstileToken === 'string' ? rawTurnstileToken.trim() : '';
      if (!turnstileToken) {
        setStatusKind('error');
        setStatusMessage('Please complete the captcha before submitting.');
        return;
      }
      payload.append('cf-turnstile-response', turnstileToken);
      const submitTimeoutMs = formState.resumeFile ? 180_000 : 60_000;
      const submitAbortController = new AbortController();
      const submitTimeout = setTimeout(() => submitAbortController.abort('submit-timeout'), submitTimeoutMs);
      let response: Response;
      try {
        response = await fetch('/api/submit', {
          method: 'POST',
          body: payload,
          signal: submitAbortController.signal,
        });
      } finally {
        clearTimeout(submitTimeout);
      }
      const data = await response.json().catch(() => null);
      if (!data?.ok) {
        throw new Error(data?.message ?? 'Unknown error');
      }
      clearStoredDraft();
      setIsThankYouModalOpen(true);
    } catch (err) {
      const aborted = isAbortError(err);
      if (!aborted) {
        console.error(err);
      }
      setStatusKind('error');
      if (aborted) {
        setStatusMessage('Submission timed out. Please retry.');
        return;
      }
      const fallbackMessage = 'Something went wrong. Please try again.';
      const errorMessage =
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : fallbackMessage;
      setStatusMessage(errorMessage);
    } finally {
      formState.setIsSubmitting(false);
    }
  };
  const handleNext = async () => goToNextStep();
  const handleBack = () =>
    setStep((current) =>
      current === 6 ? 5 : current === 5 ? 4 : current === 4 ? 3 : current === 3 ? 2 : 1,
    );
  const handleAnotherResponse = () => {
    setIsThankYouModalOpen(false);
    setIsDuplicateModalOpen(false);
    setDuplicateBranch(null);
    resetContactUsage();
    setStep(1);
    submitIntentRef.current = false;
    resetForm();
  };
  const handleReset = () => {
    setIsThankYouModalOpen(false);
    setIsDuplicateModalOpen(false);
    setDuplicateBranch(null);
    resetContactUsage();
    setStep(1);
    submitIntentRef.current = false;
    resetForm();
  };
  return {
    ...formState,
    step,
    setStep,
    cardContentRef,
    cardHeight,
    isThankYouModalOpen,
    isDuplicateModalOpen,
    duplicateBranch,
    emailAlreadyUsed,
    mobileAlreadyUsed,
    handleDuplicateModalClose: () => setIsDuplicateModalOpen(false),
    handleAnotherResponse,
    handleReset,
    staffOptions: effectiveStaffOptions,
    staffLoading: effectiveStaffLoading,
    staffBranch,
    isStaffRequired,
    isStepValid,
    showStepValidation,
    handleSubmit,
    handleNext,
    handleBack,
    handleSubmitIntent: () => { submitIntentRef.current = true; },
  };
}

