import { branches } from '../../../lib/assessment/constants';
import type { StaffOption } from '../../../lib/assessment/types';

type BranchStepProps = {
  currentLocation: string;
  onCurrentLocationChange: (value: string) => void;
  preferredBranch: string;
  onPreferredBranchChange: (value: string) => void;
  referredByStaff: string;
  onReferredByStaffChange: (value: string) => void;
  referredStaffId: string;
  onReferredStaffIdChange: (value: string) => void;
  staffBranch: string | null;
  staffLoading: boolean;
  staffOptions: StaffOption[];
  isStaffRequired: boolean;
  showValidation: boolean;
};

export default function BranchStep({
  currentLocation,
  onCurrentLocationChange,
  preferredBranch,
  onPreferredBranchChange,
  referredByStaff,
  onReferredByStaffChange,
  referredStaffId,
  onReferredStaffIdChange,
  staffBranch,
  staffLoading,
  staffOptions,
  isStaffRequired,
  showValidation,
}: BranchStepProps) {
  const currentLocationId = 'current-location-input';
  const preferredBranchId = 'preferred-branch-select';
  const referredByStaffId = 'referred-by-staff-select';
  const referredStaffIdField = 'referred-staff-select';
  const showCurrentLocationError = showValidation && !currentLocation.trim();
  const showPreferredBranchError = showValidation && !preferredBranch;
  const showReferredByStaffError = showValidation && !referredByStaff;
  const showStaffError = showValidation && isStaffRequired && !referredStaffId;

  return (
    <>
      <div className="space-y-2">
        <label htmlFor={currentLocationId} className="text-sm font-semibold text-slate-600">
          Current Location<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showCurrentLocationError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <input
            id={currentLocationId}
            data-testid={currentLocationId}
            type="text"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 placeholder:italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={currentLocation}
            onChange={(event) => onCurrentLocationChange(event.target.value)}
            placeholder="ex: Makati City"
            aria-invalid={showCurrentLocationError}
            aria-describedby={showCurrentLocationError ? 'current-location-error' : undefined}
          />
        </div>
        {showCurrentLocationError && (
          <p id="current-location-error" className="text-xs text-red-500" role="alert">
            Please enter your current location.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={preferredBranchId} className="text-sm font-semibold text-slate-600">
          Nearest Branch/Preferred Branch for Consultation<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showPreferredBranchError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id={preferredBranchId}
            data-testid={preferredBranchId}
            className="w-full bg-white rounded-xl px-3 pr-12 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={preferredBranch}
            onChange={(event) => onPreferredBranchChange(event.target.value)}
            required
            aria-invalid={showPreferredBranchError}
            aria-describedby={showPreferredBranchError ? 'preferred-branch-error' : undefined}
          >
            <option value="">Select a branch</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
        {showPreferredBranchError && (
          <p id="preferred-branch-error" className="text-xs text-red-500" role="alert">
            Please select a preferred branch.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={referredByStaffId} className="text-sm font-semibold text-slate-600">
          Are you referred by a staff member?<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showReferredByStaffError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id={referredByStaffId}
            data-testid={referredByStaffId}
            className="w-full bg-white rounded-xl px-3 pr-12 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={referredByStaff}
            onChange={(event) => onReferredByStaffChange(event.target.value)}
            aria-invalid={showReferredByStaffError}
            aria-describedby={showReferredByStaffError ? 'referred-by-staff-error' : undefined}
          >
            <option value="">Select an option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {showReferredByStaffError && (
          <p id="referred-by-staff-error" className="text-xs text-red-500" role="alert">
            Please select if you were referred by a staff member.
          </p>
        )}
      </div>

      <div
        className={[
          'space-y-2',
          referredByStaff === 'yes' ? '' : 'invisible pointer-events-none',
        ].join(' ')}
        aria-hidden={referredByStaff === 'yes' ? undefined : true}
      >
        <label htmlFor={referredStaffIdField} className="text-sm font-semibold text-slate-600">
          Staff Member
        </label>
        <div
          className={`rounded-xl border ${
            showStaffError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id={referredStaffIdField}
            data-testid={referredStaffIdField}
            className="w-full bg-white rounded-xl px-3 pr-12 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={referredStaffId}
            onChange={(event) => onReferredStaffIdChange(event.target.value)}
            disabled={referredByStaff !== 'yes' || !staffBranch || staffLoading}
            required={isStaffRequired}
            tabIndex={referredByStaff === 'yes' ? undefined : -1}
            aria-invalid={showStaffError}
            aria-describedby={showStaffError ? 'referred-staff-error' : undefined}
          >
            <option value="">
              {!staffBranch ? 'Select a branch first' : staffLoading ? 'Loading staff...' : 'Select a staff member'}
            </option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>
        {showStaffError && (
          <p id="referred-staff-error" className="text-xs text-red-500" role="alert">
            Please select a staff member.
          </p>
        )}
      </div>
    </>
  );
}

