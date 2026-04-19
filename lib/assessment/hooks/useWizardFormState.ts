'use client';
import { useCallback, useEffect, useState } from 'react';
import { OFFICE_NOW_VALUE } from '../constants';
import useDraftPersistence from './useDraftPersistence';
import { resetWizardFormState } from './wizardFormReset';

export default function useWizardFormState() {
  const [currentLocation, setCurrentLocation] = useState('');
  const [preferredBranch, setPreferredBranch] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<'success' | 'error' | null>(null);
  const [referredByStaff, setReferredByStaff] = useState('');
  const [referredStaffId, setReferredStaffId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isUsPassportHolder, setIsUsPassportHolder] = useState('');
  const [highestEducationalAttainment, setHighestEducationalAttainment] = useState('');
  const [englishTest, setEnglishTest] = useState('');
  const [hasWorked, setHasWorked] = useState('');
  const [hasVisaRefusal, setHasVisaRefusal] = useState('');
  const [studyDestinations, setStudyDestinations] = useState<string[]>([]);
  const [otherStudyDestination, setOtherStudyDestination] = useState('');
  const [preferredCoursesOfStudy, setPreferredCoursesOfStudy] = useState<string[]>([]);
  const [otherPreferredCourseOfStudy, setOtherPreferredCourseOfStudy] = useState('');
  const [plannedStudyStart, setPlannedStudyStart] = useState('');
  const [preferredConsultationMethod, setPreferredConsultationMethodState] = useState('');
  const [preferredConsultationDate, setPreferredConsultationDate] = useState('');
  const [lastValidPreferredConsultationDate, setLastValidPreferredConsultationDate] = useState('');
  const [isConsultationDateWeekend, setIsConsultationDateWeekend] = useState(false);
  const [preferredConsultationTime, setPreferredConsultationTime] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileError, setResumeFileError] = useState<string | null>(null);
  const [discoverySources, setDiscoverySources] = useState<string[]>([]);
  const [otherDiscoverySource, setOtherDiscoverySource] = useState('');
  const [referralCode, setReferralCode] = useState('');
  useEffect(() => {
    if (!statusMessage) return;
    const handle = setTimeout(() => setStatusMessage(null), 5000);
    return () => clearTimeout(handle);
  }, [statusMessage]);
  const handleReferredByStaffChange = useCallback((value: string) => {
    setReferredByStaff(value);
    if (value !== 'yes') {
      setReferredStaffId('');
    }
  }, []);
  const handlePreferredConsultationDateChange = useCallback((next: string) => {
    if (!next) {
      setPreferredConsultationDate('');
      setLastValidPreferredConsultationDate('');
      setIsConsultationDateWeekend(false);
      return;
    }

    setPreferredConsultationDate(next);
    setLastValidPreferredConsultationDate(next);

    const selected = new Date(`${next}T00:00:00`);
    const day = selected.getDay();
    setIsConsultationDateWeekend(day === 0 || day === 6);
  }, []);
  const handlePreferredConsultationMethodChange = useCallback(
    (value: string) => {
      const today = new Date();
      const todayIso = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');

      setPreferredConsultationMethodState(value);

      if (value === OFFICE_NOW_VALUE) {
        setPreferredConsultationDate(todayIso);
        setLastValidPreferredConsultationDate(todayIso);
        setIsConsultationDateWeekend(false);
        return;
      }

      // Switching away from "office now" should require re-picking a future date.
      if (preferredConsultationMethod === OFFICE_NOW_VALUE && preferredConsultationDate === todayIso) {
        setPreferredConsultationDate('');
        setLastValidPreferredConsultationDate('');
        setIsConsultationDateWeekend(false);
      }
    },
    [preferredConsultationMethod, preferredConsultationDate],
  );
  const handleResumeFileChange = useCallback((file: File | null) => {
    if (!file) {
      setResumeFile(null);
      setResumeFileError(null);
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setResumeFile(null);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setResumeFileError(`"${file.name}" is ${sizeMb}MB. Maximum allowed file size is 5MB.`);
      return;
    }

    setResumeFile(file);
    setResumeFileError(null);
  }, []);
  const { clearStoredDraft } = useDraftPersistence({
    values: {
      currentLocation,
      preferredBranch,
      referredByStaff,
      referredStaffId,
      fullName,
      mobileNumber,
      emailAddress,
      dateOfBirth,
      isUsPassportHolder,
      highestEducationalAttainment,
      englishTest,
      hasWorked,
      hasVisaRefusal,
      studyDestinations,
      otherStudyDestination,
      preferredCoursesOfStudy,
      otherPreferredCourseOfStudy,
      plannedStudyStart,
      preferredConsultationMethod,
      preferredConsultationDate,
      preferredConsultationTime,
      discoverySources,
      otherDiscoverySource,
      referralCode,
    },
    setters: {
      setCurrentLocation,
      setPreferredBranch,
      setReferredStaffId,
      setFullName,
      setMobileNumber,
      setEmailAddress,
      setDateOfBirth,
      setIsUsPassportHolder,
      setHighestEducationalAttainment,
      setEnglishTest,
      setHasWorked,
      setHasVisaRefusal,
      setStudyDestinations,
      setOtherStudyDestination,
      setPreferredCoursesOfStudy,
      setOtherPreferredCourseOfStudy,
      setPlannedStudyStart,
      setPreferredConsultationMethod: setPreferredConsultationMethodState,
      setPreferredConsultationDate,
      setPreferredConsultationTime,
      setDiscoverySources,
      setOtherDiscoverySource,
      setReferralCode,
    },
    onReferredByStaffChange: handleReferredByStaffChange,
    setLastValidPreferredConsultationDate,
    setIsConsultationDateWeekend,
  });
  const resetForm = () =>
    resetWizardFormState({
      setCurrentLocation, setPreferredBranch, setStatusMessage, setStatusKind,
      setReferredByStaff, setReferredStaffId, setIsSubmitting, setFullName,
      setMobileNumber, setEmailAddress, setDateOfBirth, setIsUsPassportHolder,
      setHighestEducationalAttainment, setEnglishTest, setHasWorked, setHasVisaRefusal,
      setStudyDestinations, setOtherStudyDestination, setPreferredCoursesOfStudy, setOtherPreferredCourseOfStudy,
      setPlannedStudyStart, setPreferredConsultationMethodState, setPreferredConsultationDate,
      setLastValidPreferredConsultationDate, setIsConsultationDateWeekend, setPreferredConsultationTime,
      setResumeFile, setResumeFileError, setDiscoverySources, setOtherDiscoverySource,
      setReferralCode, clearStoredDraft,
    });
  return {
    currentLocation,
    setCurrentLocation,
    preferredBranch,
    setPreferredBranch,
    statusMessage,
    setStatusMessage,
    statusKind,
    setStatusKind,
    referredByStaff,
    setReferredByStaff: handleReferredByStaffChange,
    referredStaffId,
    setReferredStaffId,
    isSubmitting,
    setIsSubmitting,
    fullName,
    setFullName,
    mobileNumber,
    setMobileNumber,
    emailAddress,
    setEmailAddress,
    dateOfBirth,
    setDateOfBirth,
    isUsPassportHolder,
    setIsUsPassportHolder,
    highestEducationalAttainment,
    setHighestEducationalAttainment,
    englishTest,
    setEnglishTest,
    hasWorked,
    setHasWorked,
    hasVisaRefusal,
    setHasVisaRefusal,
    studyDestinations,
    setStudyDestinations,
    otherStudyDestination,
    setOtherStudyDestination,
    preferredCoursesOfStudy,
    setPreferredCoursesOfStudy,
    otherPreferredCourseOfStudy,
    setOtherPreferredCourseOfStudy,
    plannedStudyStart,
    setPlannedStudyStart,
    preferredConsultationMethod,
    setPreferredConsultationMethod: handlePreferredConsultationMethodChange,
    preferredConsultationDate,
    isConsultationDateWeekend,
    preferredConsultationTime,
    setPreferredConsultationTime,
    resumeFile,
    resumeFileError,
    handleResumeFileChange,
    handlePreferredConsultationDateChange,
    discoverySources,
    setDiscoverySources,
    otherDiscoverySource,
    setOtherDiscoverySource,
    referralCode,
    setReferralCode,
    clearStoredDraft,
    resetForm,
  };
}

