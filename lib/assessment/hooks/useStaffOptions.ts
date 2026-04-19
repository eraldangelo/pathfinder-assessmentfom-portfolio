'use client';

import { useEffect, useMemo, useState } from 'react';

import type { StaffOption } from '../types';

type UseStaffOptionsArgs = {
  preferredBranch: string;
  referredByStaff: string;
  staffBranch: string | null;
  setReferredStaffId: React.Dispatch<React.SetStateAction<string>>;
};

export default function useStaffOptions({
  preferredBranch,
  referredByStaff,
  staffBranch,
  setReferredStaffId,
}: UseStaffOptionsArgs) {
  const [optionsByBranch, setOptionsByBranch] = useState<Record<string, StaffOption[]>>({});

  useEffect(() => {
    if (referredByStaff !== 'yes' || !staffBranch) return;

    let isActive = true;
    fetch(`/api/personnel?branch=${encodeURIComponent(staffBranch)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!isActive) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setOptionsByBranch((current) => ({ ...current, [staffBranch]: items }));
        setReferredStaffId((current) => (items.some((item: StaffOption) => item.id === current) ? current : ''));
      })
      .catch(() => {
        if (!isActive) return;
        setOptionsByBranch((current) => ({ ...current, [staffBranch]: [] }));
      });

    return () => {
      isActive = false;
    };
  }, [preferredBranch, referredByStaff, staffBranch, setReferredStaffId]);

  const staffOptions = useMemo(() => {
    if (!staffBranch) return [];
    return optionsByBranch[staffBranch] ?? [];
  }, [optionsByBranch, staffBranch]);

  const staffLoading = referredByStaff === 'yes' && !!staffBranch && !optionsByBranch[staffBranch];

  return { staffOptions, staffLoading };
}
