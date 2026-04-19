'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import type { UseDraftPersistenceArgs } from './useDraftPersistence.types';

const DRAFT_STORAGE_KEY = 'assessment-form-draft-v3';
const DRAFT_TTL_MS = 30 * 60 * 1000;
// Intentionally excludes long-lived storage of fullName/mobile/email/dateOfBirth.

type PersistedDraft = {
  expiresAt: number;
  currentLocation: string;
  preferredBranch: string;
  referredByStaff: string;
  referredStaffId: string;
  isUsPassportHolder: string;
  highestEducationalAttainment: string;
  englishTest: string;
  hasWorked: string;
  hasVisaRefusal: string;
  studyDestinations: string[];
  otherStudyDestination: string;
  preferredCoursesOfStudy: string[];
  otherPreferredCourseOfStudy: string;
  plannedStudyStart: string;
  preferredConsultationMethod: string;
  preferredConsultationDate: string;
  preferredConsultationTime: string;
  discoverySources: string[];
  otherDiscoverySource: string;
  referralCode: string;
};

const readStorage = () => (typeof window === 'undefined' ? null : window.sessionStorage);

const parseDraft = (raw: string | null): PersistedDraft | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedDraft>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() > parsed.expiresAt) return null;
    return {
      expiresAt: parsed.expiresAt,
      currentLocation: parsed.currentLocation ?? '',
      preferredBranch: parsed.preferredBranch ?? '',
      referredByStaff: parsed.referredByStaff ?? '',
      referredStaffId: parsed.referredStaffId ?? '',
      isUsPassportHolder: parsed.isUsPassportHolder ?? '',
      highestEducationalAttainment: parsed.highestEducationalAttainment ?? '',
      englishTest: parsed.englishTest ?? '',
      hasWorked: parsed.hasWorked ?? '',
      hasVisaRefusal: parsed.hasVisaRefusal ?? '',
      studyDestinations: Array.isArray(parsed.studyDestinations) ? parsed.studyDestinations : [],
      otherStudyDestination: parsed.otherStudyDestination ?? '',
      preferredCoursesOfStudy: Array.isArray(parsed.preferredCoursesOfStudy) ? parsed.preferredCoursesOfStudy : [],
      otherPreferredCourseOfStudy: parsed.otherPreferredCourseOfStudy ?? '',
      plannedStudyStart: parsed.plannedStudyStart ?? '',
      preferredConsultationMethod: parsed.preferredConsultationMethod ?? '',
      preferredConsultationDate: parsed.preferredConsultationDate ?? '',
      preferredConsultationTime: parsed.preferredConsultationTime ?? '',
      discoverySources: Array.isArray(parsed.discoverySources) ? parsed.discoverySources : [],
      otherDiscoverySource: parsed.otherDiscoverySource ?? '',
      referralCode: parsed.referralCode ?? '',
    };
  } catch {
    return null;
  }
};

export default function useDraftPersistence({
  values,
  setters,
  onReferredByStaffChange,
  setLastValidPreferredConsultationDate,
  setIsConsultationDateWeekend,
}: UseDraftPersistenceArgs) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const {
    setCurrentLocation,
    setPreferredBranch,
    setReferredStaffId,
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
    setPreferredConsultationMethod,
    setPreferredConsultationDate,
    setPreferredConsultationTime,
    setDiscoverySources,
    setOtherDiscoverySource,
    setReferralCode,
  } = setters;

  const clearStoredDraft = useCallback(() => {
    readStorage()?.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const storage = readStorage();
    if (!storage) return;

    const draft = parseDraft(storage.getItem(DRAFT_STORAGE_KEY));
    if (!draft) {
      clearStoredDraft();
      setHasHydrated(true);
      return;
    }

    setCurrentLocation(draft.currentLocation);
    setPreferredBranch(draft.preferredBranch);
    onReferredByStaffChange(draft.referredByStaff);
    setReferredStaffId(draft.referredStaffId);
    setIsUsPassportHolder(draft.isUsPassportHolder);
    setHighestEducationalAttainment(draft.highestEducationalAttainment);
    setEnglishTest(draft.englishTest);
    setHasWorked(draft.hasWorked);
    setHasVisaRefusal(draft.hasVisaRefusal);
    setStudyDestinations(draft.studyDestinations);
    setOtherStudyDestination(draft.otherStudyDestination);
    setPreferredCoursesOfStudy(draft.preferredCoursesOfStudy);
    setOtherPreferredCourseOfStudy(draft.otherPreferredCourseOfStudy);
    setPlannedStudyStart(draft.plannedStudyStart);
    setPreferredConsultationMethod(draft.preferredConsultationMethod);
    setPreferredConsultationDate(draft.preferredConsultationDate);
    setLastValidPreferredConsultationDate(draft.preferredConsultationDate);
    setPreferredConsultationTime(draft.preferredConsultationTime);
    setDiscoverySources(draft.discoverySources);
    setOtherDiscoverySource(draft.otherDiscoverySource);
    setReferralCode(draft.referralCode);

    const selected = new Date(`${draft.preferredConsultationDate}T00:00:00`);
    const day = selected.getDay();
    setIsConsultationDateWeekend(day === 0 || day === 6);
    setHasHydrated(true);
  }, [
    clearStoredDraft,
    onReferredByStaffChange,
    setCurrentLocation,
    setPreferredBranch,
    setReferredStaffId,
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
    setPreferredConsultationMethod,
    setPreferredConsultationDate,
    setPreferredConsultationTime,
    setDiscoverySources,
    setOtherDiscoverySource,
    setReferralCode,
    setIsConsultationDateWeekend,
    setLastValidPreferredConsultationDate,
  ]);

  useEffect(() => {
    if (!hasHydrated) return;
    const storage = readStorage();
    if (!storage) return;

    const payload: PersistedDraft = {
      expiresAt: Date.now() + DRAFT_TTL_MS,
      currentLocation: values.currentLocation,
      preferredBranch: values.preferredBranch,
      referredByStaff: values.referredByStaff,
      referredStaffId: values.referredStaffId,
      isUsPassportHolder: values.isUsPassportHolder,
      highestEducationalAttainment: values.highestEducationalAttainment,
      englishTest: values.englishTest,
      hasWorked: values.hasWorked,
      hasVisaRefusal: values.hasVisaRefusal,
      studyDestinations: values.studyDestinations,
      otherStudyDestination: values.otherStudyDestination,
      preferredCoursesOfStudy: values.preferredCoursesOfStudy,
      otherPreferredCourseOfStudy: values.otherPreferredCourseOfStudy,
      plannedStudyStart: values.plannedStudyStart,
      preferredConsultationMethod: values.preferredConsultationMethod,
      preferredConsultationDate: values.preferredConsultationDate,
      preferredConsultationTime: values.preferredConsultationTime,
      discoverySources: values.discoverySources,
      otherDiscoverySource: values.otherDiscoverySource,
      referralCode: values.referralCode,
    };

    const isEmpty = Object.entries(payload)
      .filter(([key]) => key !== 'expiresAt')
      .every(([, value]) => (Array.isArray(value) ? value.length === 0 : !String(value || '').trim()));
    if (isEmpty) {
      clearStoredDraft();
      return;
    }

    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  }, [clearStoredDraft, hasHydrated, values]);

  return { clearStoredDraft };
}

