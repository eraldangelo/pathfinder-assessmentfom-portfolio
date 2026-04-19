type DiscoveryStepProps = {
  discoverySources: string[];
  onDiscoverySourcesChange: (next: string[]) => void;
  otherDiscoverySource: string;
  onOtherDiscoverySourceChange: (value: string) => void;
  referralCode: string;
  onReferralCodeChange: (value: string) => void;
  showValidation: boolean;
};

const discoveryOptions = [
  'Official Website',
  'Official TikTok Page',
  'Official Facebook Page',
  'Official Instagram Page',
  'Official Webinar/Infosession',
  'In-Person Information Session',
  'Study Abroad Event',
  'Facebook Groups / Blogs (Reddit etc.)',
  'TikTok Influencers',
  'YouTube Influencers',
  'LinkedIn',
  'Google',
  'Word of Mouth',
  'University/School Website',
  'Billboards, Flyers, Brochures, Advertisment',
  'Others',
] as const;

export default function DiscoveryStep({
  discoverySources,
  onDiscoverySourcesChange,
  otherDiscoverySource,
  onOtherDiscoverySourceChange,
  referralCode,
  onReferralCodeChange,
  showValidation,
}: DiscoveryStepProps) {
  const otherSourceId = 'other-discovery-source';
  const referralCodeId = 'referral-code-input';
  const isOtherSelected = discoverySources.includes('Others');
  const showSourcesError = showValidation && discoverySources.length === 0;
  const showOtherSourceError = showValidation && isOtherSelected && !otherDiscoverySource.trim();

  const toggleSource = (source: string) => {
    const hasSource = discoverySources.includes(source);
    onDiscoverySourcesChange(
      hasSource
        ? discoverySources.filter((item) => item !== source)
        : [...discoverySources, source],
    );
    if (hasSource && source === 'Others') {
      onOtherDiscoverySourceChange('');
    }
  };

  return (
    <>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-600">
          How did you hear about us?<span className="text-red-500 ml-1">*</span>
        </legend>

        <div
          className={`grid grid-cols-2 gap-x-4 gap-y-2 pt-1 ${
            showSourcesError ? 'rounded-xl ring-2 ring-red-100' : ''
          }`}
          aria-invalid={showSourcesError}
          aria-describedby={showSourcesError ? 'discovery-sources-error' : undefined}
        >
          {discoveryOptions.map((option) => {
            const isChecked = discoverySources.includes(option);
            return (
              <label key={option} className="flex items-start gap-2 text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#014d9c]"
                  checked={isChecked}
                  onChange={() => toggleSource(option)}
                />
                <span className="text-sm leading-snug">{option}</span>
              </label>
            );
          })}
        </div>

        {isOtherSelected && (
          <div className="pt-2">
            <div
              className={`rounded-xl border ${
                showOtherSourceError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
              }`}
            >
              <input
                id={otherSourceId}
                type="text"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 placeholder:italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={otherDiscoverySource}
                onChange={(event) => onOtherDiscoverySourceChange(event.target.value)}
                placeholder="Please specify"
                aria-invalid={showOtherSourceError}
                aria-describedby={showOtherSourceError ? 'other-discovery-source-error' : undefined}
              />
            </div>
          </div>
        )}
        {showSourcesError && (
          <p id="discovery-sources-error" className="text-xs text-red-500" role="alert">
            Please select how you heard about us.
          </p>
        )}
        {showOtherSourceError && (
          <p id="other-discovery-source-error" className="text-xs text-red-500" role="alert">
            Please specify how you heard about us.
          </p>
        )}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={referralCodeId} className="text-sm font-semibold text-slate-600">Referral Code</label>
        <div className="rounded-xl border border-slate-200">
          <input
            id={referralCodeId}
            type="text"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 placeholder:italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={referralCode}
            onChange={(event) => onReferralCodeChange(event.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
    </>
  );
}


