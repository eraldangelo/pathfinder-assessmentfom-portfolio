type StudyDestinationStepProps = {
  studyDestinations: string[];
  onStudyDestinationsChange: (next: string[]) => void;
  otherStudyDestination: string;
  onOtherStudyDestinationChange: (value: string) => void;
  preferredCoursesOfStudy: string[];
  onPreferredCoursesOfStudyChange: (next: string[]) => void;
  otherPreferredCourseOfStudy: string;
  onOtherPreferredCourseOfStudyChange: (value: string) => void;
  plannedStudyStart: string;
  onPlannedStudyStartChange: (value: string) => void;
  showValidation: boolean;
};

const destinationOptions = [
  'Australia',
  'Canada',
  'New Zealand',
  'Ireland',
  'United Kingdom',
  'United States of America',
  'Germany',
  'Other',
] as const;

export default function StudyDestinationStep({
  studyDestinations,
  onStudyDestinationsChange,
  otherStudyDestination,
  onOtherStudyDestinationChange,
  preferredCoursesOfStudy,
  onPreferredCoursesOfStudyChange,
  otherPreferredCourseOfStudy,
  onOtherPreferredCourseOfStudyChange,
  plannedStudyStart,
  onPlannedStudyStartChange,
  showValidation,
}: StudyDestinationStepProps) {
  const otherDestinationId = 'other-study-destination-input';
  const otherCourseId = 'other-preferred-course-input';
  const plannedStudyStartId = 'planned-study-start-input';
  const toggleDestination = (destination: string) => {
    const hasDestination = studyDestinations.includes(destination);
    onStudyDestinationsChange(
      hasDestination
        ? studyDestinations.filter((item) => item !== destination)
        : [...studyDestinations, destination],
    );
    if (hasDestination && destination === 'Other') {
      onOtherStudyDestinationChange('');
    }
  };

  const isOtherSelected = studyDestinations.includes('Other');
  const isOtherCourseSelected = preferredCoursesOfStudy.includes('Others');
  const showDestinationsError = showValidation && studyDestinations.length === 0;
  const showOtherDestinationError = showValidation && isOtherSelected && !otherStudyDestination.trim();
  const showCoursesError = showValidation && preferredCoursesOfStudy.length === 0;
  const showOtherCourseError = showValidation && isOtherCourseSelected && !otherPreferredCourseOfStudy.trim();
  const showPlannedStartError = showValidation && !plannedStudyStart;

  const courseOptions = [
    'Secondary Education - Year 10, Year 11, or Year 12',
    'Vocational - Certificates, Diploma, Advanced Diploma',
    "Bachelor's Degree",
    "Master's Degree - Coursework",
    "Master's Degree - Research",
    'PhD',
    'Others',
  ] as const;

  const toggleCourse = (course: string) => {
    const hasCourse = preferredCoursesOfStudy.includes(course);
    onPreferredCoursesOfStudyChange(
      hasCourse
        ? preferredCoursesOfStudy.filter((item) => item !== course)
        : [...preferredCoursesOfStudy, course],
    );
    if (hasCourse && course === 'Others') {
      onOtherPreferredCourseOfStudyChange('');
    }
  };

  return (
    <>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-600">
          Study Destination<span className="text-red-500 ml-1">*</span>
        </legend>
        <div className="text-xs text-slate-500">
          Note: The United States of America destination is exclusive for Makati Office
        </div>

        <div
          className={`grid grid-cols-2 gap-x-4 gap-y-2 pt-1 ${
            showDestinationsError ? 'rounded-xl ring-2 ring-red-100' : ''
          }`}
          aria-invalid={showDestinationsError}
          aria-describedby={showDestinationsError ? 'study-destinations-error' : undefined}
        >
          {destinationOptions.map((option) => {
            const isChecked = studyDestinations.includes(option);
            return (
              <label key={option} className="flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#014d9c]"
                  checked={isChecked}
                  onChange={() => toggleDestination(option)}
                />
                <span className="text-sm">{option}</span>
              </label>
            );
          })}
        </div>

        {isOtherSelected && (
          <div className="pt-2">
            <div
              className={`rounded-xl border ${
                showOtherDestinationError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
              }`}
            >
              <input
                id={otherDestinationId}
                type="text"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 placeholder:italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={otherStudyDestination}
                onChange={(event) => onOtherStudyDestinationChange(event.target.value)}
                placeholder="Please specify country (e.g. Japan)"
                aria-invalid={showOtherDestinationError}
                aria-describedby={showOtherDestinationError ? 'other-destination-error' : undefined}
              />
            </div>
          </div>
        )}
        {showDestinationsError && (
          <p id="study-destinations-error" className="text-xs text-red-500" role="alert">
            Please select at least one study destination.
          </p>
        )}
        {showOtherDestinationError && (
          <p id="other-destination-error" className="text-xs text-red-500" role="alert">
            Please specify your other study destination.
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-600">
          Preferred Course of Study<span className="text-red-500 ml-1">*</span>
        </legend>
        <div
          className={`grid grid-cols-2 gap-x-4 gap-y-2 pt-1 ${
            showCoursesError ? 'rounded-xl ring-2 ring-red-100' : ''
          }`}
          aria-invalid={showCoursesError}
          aria-describedby={showCoursesError ? 'preferred-courses-error' : undefined}
        >
          {courseOptions.map((option) => {
            const isChecked = preferredCoursesOfStudy.includes(option);
            return (
              <label key={option} className="flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#014d9c]"
                  checked={isChecked}
                  onChange={() => toggleCourse(option)}
                />
                <span className="text-sm">{option.includes("'") ? <>{option}</> : option}</span>
              </label>
            );
          })}
        </div>

        {isOtherCourseSelected && (
          <div className="pt-2">
            <div
              className={`rounded-xl border ${
                showOtherCourseError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
              }`}
            >
              <input
                id={otherCourseId}
                type="text"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 placeholder:italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={otherPreferredCourseOfStudy}
                onChange={(event) => onOtherPreferredCourseOfStudyChange(event.target.value)}
                placeholder="Please specify (e.g. Nursing)"
                aria-invalid={showOtherCourseError}
                aria-describedby={showOtherCourseError ? 'other-course-error' : undefined}
              />
            </div>
          </div>
        )}
        {showCoursesError && (
          <p id="preferred-courses-error" className="text-xs text-red-500" role="alert">
            Please select at least one preferred course of study.
          </p>
        )}
        {showOtherCourseError && (
          <p id="other-course-error" className="text-xs text-red-500" role="alert">
            Please specify your other preferred course of study.
          </p>
        )}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={plannedStudyStartId} className="text-sm font-semibold text-slate-600">
          When do you plan to start your study abroad?<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showPlannedStartError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <input
            id={plannedStudyStartId}
            data-testid={plannedStudyStartId}
            type="month"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={plannedStudyStart}
            onChange={(event) => onPlannedStudyStartChange(event.target.value)}
            aria-invalid={showPlannedStartError}
            aria-describedby={showPlannedStartError ? 'planned-study-start-error' : undefined}
          />
        </div>
        {showPlannedStartError && (
          <p id="planned-study-start-error" className="text-xs text-red-500" role="alert">
            Please select when you plan to start your study abroad.
          </p>
        )}
      </div>
    </>
  );
}
