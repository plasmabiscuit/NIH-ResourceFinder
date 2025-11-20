const { useEffect, useMemo, useRef, useState } = React;

const uniqueSorted = (values) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

const normalizeResource = (item, index) => {
  const maintainingICs = item.lifecycle_curation?.maintaining_ic ?? [];
  const resourceTypes = item.type_content?.resource_type ?? [];
  const domains = item.type_content?.domains ?? [];
  const computeLocation = item.practical_usage?.compute_location ?? [];
  const keywords = item.tagging?.keywords ?? [];
  const accessModel = item.access_cost?.access_model ?? '';
  const dataSensitivity = item.access_cost?.data_sensitivity ?? '';

  return {
    id: item.identity?.id ?? `resource-${index}`,
    name: item.identity?.resource_name ?? 'Untitled Resource',
    shortName: item.identity?.short_name ?? '',
    icCode: item.identity?.ic_code ?? '',
    icName: item.identity?.ic_name ?? '',
    primaryUrl: item.identity?.primary_url ?? '',
    docsUrl: item.identity?.docs_url ?? '',
    apiUrl: item.identity?.api_url ?? '',
    resourceTypes,
    domains,
    costStatus: item.access_cost?.cost_status ?? '',
    accessModel,
    requiresDua: Boolean(item.access_cost?.requires_dua),
    requiresRegistration: Boolean(item.access_cost?.requires_registration),
    dataSensitivity,
    hasHumanData: Boolean(item.access_cost?.has_human_data),
    maintainingICs: maintainingICs.length ? maintainingICs : [],
    computeLocation,
    skillsRequired: item.practical_usage?.skills_required ?? [],
    typicalUseCases: item.practical_usage?.typical_use_cases ?? '',
    integrationParents: item.practical_usage?.integration_parents ?? [],
    notes: item.lifecycle_curation?.notes ?? '',
    status: item.lifecycle_curation?.status ?? '',
    keywords,
    hasApi: Boolean(item.identity?.api_url),
    isWebBased: hasWebAccess(computeLocation),
    accessRestrictiveness: classifyAccessModel(accessModel),
    sensitivityRestrictiveness: classifySensitivity(dataSensitivity),
  };
};

const createSearchIndex = (items) => {
  if (!window.FlexSearch) {
    return null;
  }

  const index = new window.FlexSearch.Index({
    tokenize: 'forward',
    cache: true,
    preset: 'match',
  });

  items.forEach((item) => {
    const text = [
      item.name,
      item.shortName,
      item.icCode,
      item.icName,
      item.resourceTypes.join(' '),
      item.domains.join(' '),
      item.typicalUseCases,
      item.skillsRequired.join(' '),
      item.keywords.join(' '),
      item.notes,
    ]
      .filter(Boolean)
      .join(' ');

    index.add(item.id, text);
  });

  return index;
};

const LOGO_LIBRARY = {
  CC: { small: 'Icons/CC.png', large: 'Icons/CC.png' },
  CIT: { small: 'Icons/CIT.png', large: 'Icons/CIT.png' },
  CSR: { small: 'Icons/CSR.png', large: 'Icons/CSR.png' },
  FIC: { small: 'Icons/FIC.png', large: 'Icons/FIC.png' },
  NCATS: { small: 'Icons/NCATS.png', large: 'Icons/NCATS.png' },
  NCCIH: { small: 'Icons/NCCIH.png', large: 'Icons/NCCIH.png' },
  NCI: { small: 'Icons/NCI.png', large: 'Icons/NCI.png' },
  NEI: { small: 'Icons/NEI.png', large: 'Icons/NEI.png' },
  NIEHS: { small: 'Icons/NIEHS.png', large: 'Icons/NIEHS.png' },
  NHGRI: { small: 'Icons/NHGRI.png', large: 'Icons/NHGRI.png' },
  NHLBI: { small: 'Icons/NHLBI.png', large: 'Icons/NHLBI.png' },
  NIA: { small: 'Icons/NIA.png', large: 'Icons/NIA.png' },
  NIAAA: { small: 'Icons/NIAAA.png', large: 'Icons/NIAAA.png' },
  NIAID: { small: 'Icons/NIAID.png', large: 'Icons/NIAID.png' },
  NIAMS: { small: 'Icons/NIAMSD.png', large: 'Icons/NIAMSD.png' },
  NIBIB: { small: 'Icons/NIBIB.png', large: 'Icons/NIBIB.png' },
  NICHD: { small: 'Icons/NICHHD.png', large: 'Icons/NICHHD.png' },
  NIDA: { small: 'Icons/NIDA.png', large: 'Icons/NIDA.png' },
  NIDCD: { small: 'Icons/NIDCD.png', large: 'Icons/NIDCD.png' },
  NIDCR: { small: 'Icons/NIDCR.png', large: 'Icons/NIDCR.png' },
  NIGMS: { small: 'Icons/NIGMS.png', large: 'Icons/NIGMS.png' },
  NIMH: { small: 'Icons/NIMH.png', large: 'Icons/NIMH.png' },
  NIMHD: { small: 'Icons/NIMHHD.png', large: 'Icons/NIMHHD.png' },
  NINDS: { small: 'Icons/NINDS.png', large: 'Icons/NINDS.png' },
  NINR: { small: 'Icons/NINR.png', large: 'Icons/NINR.png' },
  NLM: { small: 'Icons/NLM.png', large: 'Icons/NLM.png' },
};

const TOTAL_INSTITUTES = Object.keys(LOGO_LIBRARY).length;

const NAV_LINKS = [
  { label: 'Resources', href: '#resources' },
  { label: 'Filters', href: '#filters' },
  { label: 'Support', href: '#support' },
];

const METRIC_OPTIONS = [
  { key: 'research_grants_awards', label: 'Research grant awards by IC' },
  { key: 'research_grants_funding', label: 'Research grant funding by IC' },
  { key: 'research_project_awards', label: 'Awards by IC' },
  { key: 'research_project_funding', label: 'Funding by IC' },
  { key: 'rpg_funding_by_ic', label: 'Research project grants: funding by IC' },
  { key: 'rpg_success_rate', label: 'Success rate (RPGs) by IC' },
];

const FIRST_YEAR = 2010;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, index) => FIRST_YEAR + index);

const IC_FULL_NAME_MAP = {
  CC: 'NIH Clinical Center',
  CIT: 'Center for Information Technology',
  CSR: 'Center for Scientific Review',
  FIC: 'Fogarty International Center',
  NCATS: 'National Center for Advancing Translational Sciences',
  NCCIH: 'National Center for Complementary and Integrative Health',
  NCI: 'National Cancer Institute',
  NEI: 'National Eye Institute',
  NIEHS: 'National Institute of Environmental Health Sciences',
  NHGRI: 'National Human Genome Research Institute',
  NHLBI: 'National Heart, Lung, and Blood Institute',
  NIA: 'National Institute on Aging',
  NIAAA: 'National Institute on Alcohol Abuse and Alcoholism',
  NIAID: 'National Institute of Allergy and Infectious Diseases',
  NIAMS: 'National Institute of Arthritis and Musculoskeletal and Skin Diseases',
  NIBIB: 'National Institute of Biomedical Imaging and Bioengineering',
  NICHD: 'Eunice Kennedy Shriver National Institute of Child Health and Human Development',
  NIDA: 'National Institute on Drug Abuse',
  NIDCD: 'National Institute on Deafness and Other Communication Disorders',
  NIDCR: 'National Institute of Dental and Craniofacial Research',
  NIDDK: 'National Institute of Diabetes and Digestive and Kidney Diseases',
  NIGMS: 'National Institute of General Medical Sciences',
  NIMH: 'National Institute of Mental Health',
  NIMHD: 'National Institute on Minority Health and Health Disparities',
  NINDS: 'National Institute of Neurological Disorders and Stroke',
  NINR: 'National Institute of Nursing Research',
  NLM: 'National Library of Medicine',
};

const RESTRICTIVENESS_LABELS = ['Least restrictive', 'Moderate', 'Most restrictive'];

const classifyAccessModel = (value = '') => {
  const normalized = value.toLowerCase();
  if (!normalized) {
    return 1;
  }
  const hasControlled = /controlled|restricted|approval|dua|protected/.test(normalized);
  const hasOpen = /open|public|catalog/.test(normalized);

  if (hasControlled && !hasOpen) {
    return 2;
  }
  if (hasControlled && hasOpen) {
    return 1;
  }
  return 0;
};

const classifySensitivity = (value = '') => {
  const normalized = value.toLowerCase();
  if (!normalized) {
    return 1;
  }

  if (/public|open/.test(normalized)) {
    return 0;
  }

  if (/de-identified|limited|moderate/.test(normalized)) {
    return 1;
  }

  if (/controlled|restricted|high/.test(normalized)) {
    return 2;
  }

  return 1;
};

const hasWebAccess = (locations = []) =>
  locations.some((location) => location.toLowerCase().includes('web'));

const getYearAdjustment = (year) => {
  if (!year) {
    return 1;
  }
  return 1 + (year - FIRST_YEAR) * 0.015;
};

const getMetricValue = (ic, metricKey, year) => {
  if (!metricKey) {
    return 0;
  }
  const base = ic.metrics?.[metricKey] ?? 0;
  const factor = getYearAdjustment(year);
  return Math.round(base * factor);
};

const formatMetricValue = (metricKey, value) => {
  if (value == null || Number.isNaN(value)) {
    return 'N/A';
  }

  const fundingKeys = [
    'research_grants_funding',
    'research_project_funding',
    'rpg_funding_by_ic',
  ];

  if (fundingKeys.includes(metricKey)) {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  }

  if (metricKey === 'rpg_success_rate') {
    return `${value.toFixed(1)}%`;
  }

  return value.toLocaleString();
};

const formatShare = (share) => {
  if (share == null || Number.isNaN(share)) {
    return 'N/A';
  }
  return `${(share * 100).toFixed(1)}% of total`;
};

const buildEssentialLinks = (code) => {
  const lower = code?.toLowerCase() || '';
  return [
    {
      label: `${code} homepage`,
      url: `https://www.${lower}.nih.gov/`,
    },
    {
      label: 'RePORTER portfolio',
      url: `https://reporter.nih.gov/search?ic=${code}`,
    },
    {
      label: 'Funding opportunities',
      url: 'https://grants.nih.gov/grants/guide/parent_announcements.htm',
    },
  ];
};

const createSampleMetrics = (codeIndex) => {
  const base = 150 + codeIndex * 11;
  return {
    research_grants_awards: base * 5,
    research_grants_funding: base * 9_000_000,
    research_project_awards: base * 4,
    research_project_funding: base * 7_500_000,
    rpg_funding_by_ic: base * 6_500_000,
    rpg_success_rate: 10 + (codeIndex % 7) * 2,
  };
};

const buildQuickLaunchStats = () => {
  const entries = Object.keys(LOGO_LIBRARY);
  return entries.map((code, index) => ({
    code,
    abbreviation: code,
    name: IC_FULL_NAME_MAP[code] || `${code} Institute`,
    metrics: createSampleMetrics(index + 1),
    essentialLinks: buildEssentialLinks(code),
  }));
};

const QUICK_LAUNCH_STATS = buildQuickLaunchStats();

const getIcAssets = (ic) => {
  const normalized = (ic || '').toUpperCase();
  const assets = LOGO_LIBRARY[normalized] || {};
  return {
    code: ic,
    small: assets.small || null,
    large: assets.large || assets.small || null,
  };
};

const MaintainerLogoRow = ({ ics, size = 'small' }) => {
  if (!ics.length) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center ${size === 'large' ? 'gap-3' : 'gap-2'}`}
      aria-label="Maintaining IC logos"
    >
      {ics.map((ic, index) => {
        const assets = getIcAssets(ic);
        const source = size === 'large' ? assets.large : assets.small || assets.large;

        if (source) {
          return (
            <img
              key={`${ic}-${index}-${size}`}
              src={source}
              alt={`${assets.code || 'IC'} logo`}
              className={size === 'large' ? 'h-12 w-auto' : 'h-8 w-8'}
            />
          );
        }

        return (
          <span
            key={`${ic}-${index}-${size}`}
            className={`rounded-full bg-slate-100 font-semibold text-slate-600 ${
              size === 'large' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
            }`}
          >
            {assets.code}
          </span>
        );
      })}
    </div>
  );
};

const LogoFilterGrid = ({ options, selected, onToggle }) => {
  if (!options.length) {
    return null;
  }

  return (
    <div className="ic-ribbon-grid" role="group" aria-label="Filter by Institute or Center">
      {options.map((option) => {
        const assets = getIcAssets(option);
        if (!assets.large) {
          return null;
        }
        const isActive = selected.includes(option);
        return (
          <button
            type="button"
            key={option}
            aria-pressed={isActive}
            className={`ic-ribbon-tile ${isActive ? 'is-active' : ''}`}
            onClick={() => onToggle(option)}
          >
            <span className="ic-ribbon-icon">
              <img src={assets.large} alt={`${option} logo`} />
            </span>
            <span className="ic-ribbon-label">{option}</span>
          </button>
        );
      })}
    </div>
  );
};

const MultiEntryInput = ({ label, placeholder, options, values, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const normalizedOptions = useMemo(
    () => options.map((option) => ({ label: option, match: option.toLowerCase() })),
    [options]
  );

  const addValue = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }

    const match = normalizedOptions.find((option) => option.match === trimmed.toLowerCase());
    const valueToAdd = match ? match.label : trimmed;
    if (!values.includes(valueToAdd)) {
      onChange([...values, valueToAdd]);
    }
  };

  const removeValue = (value) => {
    onChange(values.filter((item) => item !== value));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      if (inputValue.trim()) {
        event.preventDefault();
        addValue(inputValue);
        setInputValue('');
      }
    }

    if (event.key === 'Backspace' && !inputValue && values.length) {
      removeValue(values[values.length - 1]);
    }
  };

  const suggestions = useMemo(() => {
    if (!inputValue) {
      return normalizedOptions
        .map((option) => option.label)
        .filter((option) => !values.includes(option))
        .slice(0, 6);
    }

    const lowered = inputValue.toLowerCase();
    return normalizedOptions
      .filter((option) => option.match.includes(lowered) && !values.includes(option.label))
      .map((option) => option.label)
      .slice(0, 6);
  }, [inputValue, normalizedOptions, values]);

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap gap-2 p-3">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
            >
              {value}
              <button
                type="button"
                onClick={() => removeValue(value)}
                className="text-indigo-500 hover:text-indigo-700"
                aria-label={`Remove ${value}`}
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={values.length ? 'Add more…' : placeholder}
            className="min-w-[120px] flex-1 border-0 bg-transparent text-sm text-slate-700 focus:outline-none"
          />
        </div>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                addValue(suggestion);
                setInputValue('');
              }}
              className="rounded-full border border-slate-200 px-3 py-1 hover:border-indigo-300 hover:text-indigo-600"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const OptionBrowser = ({ label, options, selected, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    const lowered = searchTerm.toLowerCase();
    return options.filter((option) => option.toLowerCase().includes(lowered));
  }, [options, searchTerm]);

  if (!options.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Browse {label}</p>
          <p className="text-xs text-slate-500">Tap to see every available option.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-500"
        >
          {isOpen ? 'Hide' : 'Browse'}
        </button>
      </div>
      {isOpen && (
        <div className="mt-4 space-y-3">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={`Search ${label.toLowerCase()}`}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
            {filteredOptions.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-white"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => onToggle(option)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex-1">{option}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-2 text-xs text-slate-400">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ToggleControl = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange((prev) => !prev)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

const RestrictivenessSlider = ({ label, value, onChange }) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          {RESTRICTIVENESS_LABELS[value]}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="2"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full cursor-pointer"
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={value}
        aria-label={`${label} restrictiveness`}
      />
      <div className="mt-1 flex justify-between text-[11px] uppercase tracking-wide text-slate-400">
        <span>least</span>
        <span>most</span>
      </div>
    </div>
  );
};

const ExternalLink = ({ label, url }) => (
  <a
    href={url || undefined}
    target="_blank"
    rel="noreferrer"
    className={`inline-flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition ${
      url
        ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
        : 'cursor-not-allowed border-slate-200 text-slate-400'
    }`}
    aria-disabled={!url}
  >
    <span>{label}</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-2 h-4 w-4"
    >
      <path d="M9 7h8m0 0v8m0-8L7 17" />
    </svg>
  </a>
);

const ResourceCard = ({ resource, onToggle, isExpanded }) => {
  const maintainingICs = resource.maintainingICs.length
    ? resource.maintainingICs
    : resource.icCode
    ? [resource.icCode]
    : [];

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition ${
        isExpanded ? 'border-indigo-400 bg-white shadow-md' : 'border-slate-200 bg-white hover:shadow-md'
      }`}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => onToggle(resource.id)}
        aria-expanded={isExpanded}
      >
        <div className="space-y-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{resource.name}</h3>
            <p className="text-sm text-slate-500">
              {resource.shortName || resource.icName || maintainingICs.join(', ') || 'NIH Resource'}
            </p>
          </div>
          {resource.typicalUseCases && (
            <p className="text-sm text-slate-600">{resource.typicalUseCases}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <MaintainerLogoRow ics={maintainingICs} size="small" />
          <span className="text-xs font-medium text-indigo-600">
            {isExpanded ? 'Hide details' : 'View details'}
          </span>
        </div>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {resource.resourceTypes.slice(0, 3).map((type) => (
          <span
            key={type}
            className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
          >
            {type}
          </span>
        ))}
      </div>
      {resource.domains.length > 0 && (
        <div className="mt-3 text-xs text-slate-500">
          {resource.domains.slice(0, 3).join(' · ')}
          {resource.domains.length > 3 ? ` +${resource.domains.length - 3} more` : ''}
        </div>
      )}
      {isExpanded && (
        <div className="mt-6 space-y-6 border-t border-slate-200 pt-6 text-sm text-slate-700">
          <MaintainerLogoRow ics={maintainingICs} size="large" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Domains
              </span>
              <p className="mt-1">{resource.domains.join(', ') || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </span>
              <p className="mt-1">{resource.status || 'Active'}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Access snapshot
            </h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Cost Status</p>
                <p className="text-slate-900">{resource.costStatus || 'Not specified'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Access Model</p>
                <p className="text-slate-900">{resource.accessModel || 'Not specified'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Data Sensitivity</p>
                <p className="text-slate-900">{resource.dataSensitivity || 'Not specified'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Requirements</p>
                <p className="text-slate-900">
                  {resource.requiresRegistration ? 'Registration required' : 'No registration'} ·{' '}
                  {resource.requiresDua ? 'DUA required' : 'No DUA'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Practical usage
            </h4>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-slate-500">Typical use cases</dt>
                <dd className="text-slate-900">{resource.typicalUseCases || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Skills required</dt>
                <dd className="text-slate-900">
                  {resource.skillsRequired.length
                    ? resource.skillsRequired.join(', ')
                    : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Compute / access location</dt>
                <dd className="text-slate-900">
                  {resource.computeLocation.length
                    ? resource.computeLocation.join(', ')
                    : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Parent / Integrations</dt>
                <dd className="text-slate-900">
                  {resource.integrationParents.length
                    ? resource.integrationParents.join(', ')
                    : 'None'}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actionable links
            </h4>
            <div className="mt-3 flex flex-wrap gap-3">
              <ExternalLink label="Primary URL" url={resource.primaryUrl} />
              <ExternalLink label="Docs" url={resource.docsUrl} />
              <ExternalLink label="API" url={resource.apiUrl} />
            </div>
          </div>

          {resource.keywords.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Keywords
              </h4>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {resource.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resource.notes && (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Notes</p>
              <p>{resource.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const QuickLauncher = ({
  isActive,
  onToggle,
  metricOptions,
  selectedMetricKey,
  onMetricSelect,
  yearOptions,
  selectedYear,
  onYearChange,
}) => {
  return (
    <div className={`quick-launch-shell ${isActive ? 'is-active' : ''}`}>
      <div className="quick-launch-card">
        <div className="quick-launch-card-header">
          <div>
            <p className="quick-launch-title">Quick Launch</p>
            <p className="quick-launch-intro">
              Launch a focus view that locks onto a specific institute or center.
            </p>
          </div>
        </div>

        {isActive ? (
          <div className="quick-launch-controls">
            <div className="quick-launch-tabs" role="tablist">
              {metricOptions.map((metric) => {
                const isSelected = selectedMetricKey === metric.key;
                return (
                  <button
                    key={metric.key}
                    type="button"
                    role="tab"
                    aria-pressed={isSelected}
                    className={`quick-launch-tab ${isSelected ? 'is-active' : ''}`}
                    onClick={() => onMetricSelect(metric.key)}
                  >
                    {metric.label}
                  </button>
                );
              })}
            </div>
            <div className="quick-launch-year">
              <label htmlFor="quick-launch-year" className="quick-launch-year-label">
                Fiscal year
              </label>
              <select
                id="quick-launch-year"
                className="quick-launch-year-select"
                value={selectedYear}
                onChange={(event) => onYearChange(Number(event.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    FY {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="quick-launch-prelaunch">
            <p className="quick-launch-tagline">Jump right in to the NIH</p>
            <p className="quick-launch-subtitle">
              See data, policies, funding opportunities, and rankings with one click.
            </p>
          </div>
        )}

        <div className="quick-launch-card-footer">
          <button
            type="button"
            className={`quick-launch-button ${isActive ? 'is-active' : ''}`}
            onClick={onToggle}
          >
            {isActive ? 'Close' : 'Launch'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickLaunchDetail = ({
  ic,
  selectedMetricKey,
  metricSummary,
  onClear,
}) => {
  if (!ic) {
    return null;
  }

  const assets = getIcAssets(ic.code);
  const metricValue = selectedMetricKey
    ? getMetricValue(ic, selectedMetricKey, metricSummary?.year)
    : null;
  const rank = selectedMetricKey ? metricSummary?.ranking.get(ic.code) : null;
  const share = selectedMetricKey && metricSummary?.total ? metricValue / metricSummary.total : null;

  return (
    <div className="quick-launch-detail-card">
      <div className="quick-launch-detail-header">
        <div className="quick-launch-detail-logo">
          {assets.large ? (
            <img src={assets.large} alt={`${ic.name} logo`} />
          ) : (
            <span>{ic.abbreviation}</span>
          )}
        </div>
        <div>
          <p className="quick-launch-detail-name">{ic.name}</p>
          <p className="quick-launch-detail-code">{ic.code} · National Institutes of Health</p>
        </div>
        <button type="button" className="detail-clear" onClick={onClear}>
          Clear
        </button>
      </div>

      {selectedMetricKey ? (
        <div className="quick-launch-metric-grid">
          <div className="metric-card">
            <p className="metric-label">Metric value</p>
            <p className="metric-value">{formatMetricValue(selectedMetricKey, metricValue)}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Rank</p>
            <p className="metric-value">{rank ? `#${rank}` : 'N/A'}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Share of total</p>
            <p className="metric-value">{formatShare(share)}</p>
          </div>
        </div>
      ) : (
        <div className="quick-launch-links">
          {ic.essentialLinks.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer">
              <span>{link.label}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 7h8m0 0v8m0-8L7 17" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [selectedICs, setSelectedICs] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState([]);
  const [requireApi, setRequireApi] = useState(false);
  const [requireWeb, setRequireWeb] = useState(false);
  const [accessThreshold, setAccessThreshold] = useState(2);
  const [sensitivityThreshold, setSensitivityThreshold] = useState(2);
  const [expandedResourceId, setExpandedResourceId] = useState(null);
  const [isHeroNavOpen, setIsHeroNavOpen] = useState(false);
  const [isLauncherActive, setIsLauncherActive] = useState(false);
  const [selectedMetricKey, setSelectedMetricKey] = useState(null);
  const [selectedIc, setSelectedIc] = useState(null);
  const defaultYear = YEAR_OPTIONS[YEAR_OPTIONS.length - 1];
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const indexRef = useRef(null);
  const heroNavRef = useRef(null);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const response = await fetch('resources.json');
        if (!response.ok) {
          throw new Error('Failed to load resources');
        }
        const raw = await response.json();
        const normalized = raw.map(normalizeResource);
        setResources(normalized);
        setSearchMatches(normalized.map((item) => item.id));
        indexRef.current = createSearchIndex(normalized);
      } catch (err) {
        console.error(err);
        setError('Unable to load the resource catalogue at this time.');
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      if (heroNavRef.current && !heroNavRef.current.contains(event.target)) {
        setIsHeroNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setIsHeroNavOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSearchMatches(resources.map((item) => item.id));
      return;
    }

    if (indexRef.current) {
      const hits = indexRef.current.search(searchQuery, 100);
      setSearchMatches(Array.isArray(hits) ? hits : []);
    } else {
      const lower = searchQuery.toLowerCase();
      const fallback = resources
        .filter((item) =>
          [
            item.name,
            item.shortName,
            item.icCode,
            item.icName,
            item.domains.join(' '),
            item.resourceTypes.join(' '),
            item.typicalUseCases,
            item.keywords.join(' '),
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(lower))
        )
        .map((item) => item.id);
      setSearchMatches(fallback);
    }
  }, [searchQuery, resources]);

  const filterOptions = useMemo(() => {
    return {
      ics: uniqueSorted(
        resources.flatMap((item) =>
          item.maintainingICs.length ? item.maintainingICs : item.icCode ? [item.icCode] : []
        )
      ),
      domains: uniqueSorted(resources.flatMap((item) => item.domains)),
      resourceTypes: uniqueSorted(resources.flatMap((item) => item.resourceTypes)),
    };
  }, [resources]);

  const filteredResources = useMemo(() => {
    const resourceById = new Map(resources.map((item) => [item.id, item]));
    const baseList = searchQuery
      ? searchMatches.map((id) => resourceById.get(id)).filter(Boolean)
      : resources;
    let subset = [...baseList];

    if (searchQuery) {
      if (subset.length === 0) {
        return [];
      }
    }

    if (selectedICs.length) {
      subset = subset.filter((item) => {
        const icCandidates = item.maintainingICs.length
          ? item.maintainingICs
          : item.icCode
          ? [item.icCode]
          : [];
        return icCandidates.some((ic) => selectedICs.includes(ic));
      });
    }

    if (selectedDomains.length) {
      subset = subset.filter((item) =>
        item.domains.some((domain) => selectedDomains.includes(domain))
      );
    }

    if (selectedResourceTypes.length) {
      subset = subset.filter((item) =>
        item.resourceTypes.some((type) => selectedResourceTypes.includes(type))
      );
    }

    if (requireApi) {
      subset = subset.filter((item) => item.hasApi);
    }

    if (requireWeb) {
      subset = subset.filter((item) => item.isWebBased);
    }

    subset = subset.filter((item) => item.accessRestrictiveness <= accessThreshold);
    subset = subset.filter((item) => item.sensitivityRestrictiveness <= sensitivityThreshold);

    return subset;
  }, [
    resources,
    searchQuery,
    searchMatches,
    selectedICs,
    selectedDomains,
    selectedResourceTypes,
    requireApi,
    requireWeb,
    accessThreshold,
    sensitivityThreshold,
  ]);

  useEffect(() => {
    if (!filteredResources.length) {
      setExpandedResourceId(null);
      return;
    }

    setExpandedResourceId((current) => {
      if (current && filteredResources.some((item) => item.id === current)) {
        return current;
      }
      return filteredResources[0].id;
    });
  }, [filteredResources]);

  const toggleSelection = (value, selected, setter) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const clearFilters = () => {
    clearInstituteSelection();
    setSelectedDomains([]);
    setSelectedResourceTypes([]);
    setRequireApi(false);
    setRequireWeb(false);
    setAccessThreshold(2);
    setSensitivityThreshold(2);
  };

  const metricSummary = useMemo(() => {
    if (!selectedMetricKey) {
      return null;
    }
    const values = QUICK_LAUNCH_STATS.map((ic) => ({
      code: ic.code,
      value: getMetricValue(ic, selectedMetricKey, selectedYear),
    }));
    const total = values.reduce((sum, entry) => sum + entry.value, 0);
    const ranking = new Map(
      [...values].sort((a, b) => b.value - a.value).map((entry, index) => [entry.code, index + 1])
    );
    return { total, ranking, year: selectedYear };
  }, [selectedMetricKey, selectedYear]);

  const selectedIcData = useMemo(
    () => QUICK_LAUNCH_STATS.find((item) => item.code === selectedIc) || null,
    [selectedIc]
  );

  const icLogoOptions = useMemo(() => Object.keys(LOGO_LIBRARY), []);

  const handleMetricSelect = (metricKey) => {
    setSelectedMetricKey((current) => (current === metricKey ? null : metricKey));
  };

  const handleInstituteToggle = (code) => {
    setSelectedICs((previous) => {
      const isActive = previous.includes(code);
      const next = isActive ? previous.filter((item) => item !== code) : [...previous, code];
      if (isActive) {
        setSelectedIc((current) => (current === code ? null : current));
      } else {
        setSelectedIc(code);
        setIsLauncherActive(true);
      }
      return next;
    });
  };

  const clearInstituteSelection = () => {
    setSelectedICs([]);
    setSelectedIc(null);
    setIsLauncherActive(false);
  };

  const handleCardToggle = (resourceId) => {
    setExpandedResourceId((current) => (current === resourceId ? null : resourceId));
  };
  const clearSelectedIc = () => setSelectedIc(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading resources...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-3 text-center">
        <p className="text-lg font-semibold text-slate-800">{error}</p>
        <p className="text-sm text-slate-500">Check the JSON file and reload the page.</p>
      </div>
    );
  }

  const totalResults = filteredResources.length;
  const showHeroCopy = !isLauncherActive;

  return (
    <div className="page-shell">
      <div className={`quick-launch-float ${isLauncherActive ? 'is-active' : ''}`}>
        <QuickLauncher
          isActive={isLauncherActive}
          onToggle={() => setIsLauncherActive((previous) => !previous)}
          metricOptions={METRIC_OPTIONS}
          selectedMetricKey={selectedMetricKey}
          onMetricSelect={handleMetricSelect}
          yearOptions={YEAR_OPTIONS}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>
      <header className={`hero ${isLauncherActive ? 'is-launching' : ''}`}>
        <div className="hero-content">
          <div className={`hero-nav ${isHeroNavOpen ? 'is-open' : ''}`} ref={heroNavRef}>
            <button
              type="button"
              className="hero-nav-toggle"
              aria-expanded={isHeroNavOpen}
              aria-controls="hero-nav-menu"
              onClick={() => setIsHeroNavOpen((previous) => !previous)}
            >
              <span aria-hidden="true">NIH Resource Finder</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="hero-nav-toggle-icon"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.185l3.71-3.955a.75.75 0 1 1 1.08 1.04l-4.24 4.52a.75.75 0 0 1-1.08 0l-4.24-4.52a.75.75 0 0 1 .02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="sr-only">Toggle hero navigation menu</span>
            </button>
            <div id="hero-nav-menu" className="hero-nav-menu" hidden={!isHeroNavOpen}>
              {NAV_LINKS.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`hero-nav-link ${index === 0 ? 'is-current' : ''}`}
                  onClick={() => setIsHeroNavOpen(false)}
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true" className="hero-nav-link-indicator">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
          {showHeroCopy && (
            <>
              <h1>Search, filter, and launch NIH-supported research infrastructure</h1>
              <p className="hero-subtitle">
                Explore data repositories, biospecimen banks, and analysis tools across NIH institutes. Use
                the curated filters, NIH logo picker, and fast semantic search to hone in on the resources that
                accelerate your work.
              </p>
              <div className="hero-stat-grid">
                <div className="hero-stat">
                  <p className="hero-stat-value">{resources.length}</p>
                  <p className="hero-stat-label">Total resources</p>
                </div>
                <div className="hero-stat">
                  <p className="hero-stat-value">{TOTAL_INSTITUTES}</p>
                  <p className="hero-stat-label">Institutes</p>
                </div>
                <div className="hero-stat">
                  <p className="hero-stat-value">{filterOptions.resourceTypes.length}</p>
                  <p className="hero-stat-label">Resource types</p>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {selectedIcData && (
        <section className="quick-launch-detail">
      <QuickLaunchDetail
        ic={selectedIcData}
        selectedMetricKey={selectedMetricKey}
        metricSummary={metricSummary}
        onClear={clearSelectedIc}
      />
    </section>
  )}

      <section className="ic-ribbon-section">
        <div className="ic-ribbon-shell">
          <div className="ic-ribbon-headline">
            <p className="ic-ribbon-eyebrow">Institutes & Centers</p>
            <div className="ic-ribbon-controls">
              <div className="ic-ribbon-select">
                <label className="sr-only" htmlFor="hero-metric-select">
                  Hero metric
                </label>
                <select
                  id="hero-metric-select"
                  value={selectedMetricKey || ''}
                  onChange={(event) => handleMetricSelect(event.target.value)}
                >
                  <option value="">Essential links</option>
                  {METRIC_OPTIONS.map((metric) => (
                    <option key={metric.key} value={metric.key}>
                      {metric.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ic-ribbon-select">
                <label className="sr-only" htmlFor="hero-year-select">
                  Fiscal year
                </label>
                <select
                  id="hero-year-select"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                >
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      FY {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="ic-ribbon-clear"
                onClick={clearInstituteSelection}
                disabled={!selectedICs.length}
              >
                Clear selection
              </button>
            </div>
          </div>
          <LogoFilterGrid options={icLogoOptions} selected={selectedICs} onToggle={handleInstituteToggle} />
          <p className="ic-ribbon-title">Pick a badge to filter resources and launch detail cards</p>
        </div>
      </section>

      <main>
        <section id="resources" className="resources-panel text-slate-900">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="resource-layout">
              <aside id="filters" className="filters-column">
                <div className="filters-column-inner">
                  <div className="filter-search-card">
                    <label className="sr-only" htmlFor="resource-search">
                      Search resources
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M10.5 3.75a6.75 6.75 0 1 1 0 13.5 6.75 6.75 0 0 1 0-13.5zm0 0L16.5 15"
                          />
                        </svg>
                      </span>
                      <input
                        id="resource-search"
                        type="search"
                        placeholder="Search by resource name, domain, or keyword"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <p className="filter-search-meta">
                      <span>{totalResults}</span> resources in view
                    </p>
                  </div>

                  <div className="filters-panel rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Filters
                      </h2>
                      <button
                        className="text-xs font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-500"
                        onClick={clearFilters}
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="mt-5 space-y-6">
                      <MultiEntryInput
                        label="Resource type"
                        placeholder="Add a resource type"
                        options={filterOptions.resourceTypes}
                        values={selectedResourceTypes}
                        onChange={setSelectedResourceTypes}
                      />

                      <OptionBrowser
                        label="resource types"
                        options={filterOptions.resourceTypes}
                        selected={selectedResourceTypes}
                        onToggle={(value) =>
                          toggleSelection(value, selectedResourceTypes, setSelectedResourceTypes)
                        }
                      />

                      <MultiEntryInput
                        label="Domain"
                        placeholder="Add a domain"
                        options={filterOptions.domains}
                        values={selectedDomains}
                        onChange={setSelectedDomains}
                      />

                      <OptionBrowser
                        label="domains"
                        options={filterOptions.domains}
                        selected={selectedDomains}
                        onToggle={(value) =>
                          toggleSelection(value, selectedDomains, setSelectedDomains)
                        }
                      />

                      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Access emphasis
                        </p>
                        <ToggleControl
                          label="Has public API"
                          description="Only show resources advertising an API endpoint."
                          checked={requireApi}
                          onChange={setRequireApi}
                        />
                        <ToggleControl
                          label="Web-based experience"
                          description="Limit to resources that are primarily web hosted."
                          checked={requireWeb}
                          onChange={setRequireWeb}
                        />
                        <RestrictivenessSlider
                          label="Access model threshold"
                          value={accessThreshold}
                          onChange={setAccessThreshold}
                        />
                        <RestrictivenessSlider
                          label="Data sensitivity threshold"
                          value={sensitivityThreshold}
                          onChange={setSensitivityThreshold}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="resource-results">
                {totalResults === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                    <p className="text-lg font-semibold text-slate-700">No resources found</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Adjust your filters or search query to discover more NIH resources.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        isExpanded={expandedResourceId === resource.id}
                        onToggle={handleCardToggle}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="support" className="support-section text-white">
          <div className="mx-auto max-w-5xl px-4 text-center lg:px-8">
            <div className="rounded-3xl border border-white border-opacity-10 bg-white bg-opacity-5 p-10 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-sky-200">Need help?</p>
              <h2 className="mt-4 text-3xl font-semibold">Support for the NIH Resource Finder</h2>
            <p className="mt-4 text-base text-white text-opacity-80">
              Contact the BioData Catalyst Resource Finder team to contribute new resources, provide
              corrections, or request additional filters. Use your existing NIH support channels or
              email the program office for guidance.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold">
              <a
                href="mailto:nih-resourcefinder@nih.gov"
                className="rounded-full border border-white border-opacity-40 px-6 py-3 text-white transition hover:border-white"
              >
                Email program office
              </a>
              <a
                href="#resources"
                className="rounded-full bg-white px-6 py-3 text-slate-900 shadow-lg transition hover:-translate-y-0.5"
              >
                Back to top
              </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
