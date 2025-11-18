const { useEffect, useMemo, useRef, useState } = React;

const uniqueSorted = (values) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

const normalizeResource = (item, index) => {
  const maintainingICs = item.lifecycle_curation?.maintaining_ic ?? [];

  return {
    id: item.identity?.id ?? `resource-${index}`,
    name: item.identity?.resource_name ?? 'Untitled Resource',
    shortName: item.identity?.short_name ?? '',
    icCode: item.identity?.ic_code ?? '',
    icName: item.identity?.ic_name ?? '',
    primaryUrl: item.identity?.primary_url ?? '',
    docsUrl: item.identity?.docs_url ?? '',
    apiUrl: item.identity?.api_url ?? '',
    resourceTypes: item.type_content?.resource_type ?? [],
    domains: item.type_content?.domains ?? [],
    costStatus: item.access_cost?.cost_status ?? '',
    accessModel: item.access_cost?.access_model ?? '',
    requiresDua: Boolean(item.access_cost?.requires_dua),
    requiresRegistration: Boolean(item.access_cost?.requires_registration),
    dataSensitivity: item.access_cost?.data_sensitivity ?? '',
    hasHumanData: Boolean(item.access_cost?.has_human_data),
    maintainingICs: maintainingICs.length ? maintainingICs : [],
    computeLocation: item.practical_usage?.compute_location ?? [],
    skillsRequired: item.practical_usage?.skills_required ?? [],
    typicalUseCases: item.practical_usage?.typical_use_cases ?? '',
    integrationParents: item.practical_usage?.integration_parents ?? [],
    notes: item.lifecycle_curation?.notes ?? '',
    status: item.lifecycle_curation?.status ?? '',
    keywords: item.tagging?.keywords ?? [],
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
  CC: { small: 'abrv-logos/CC.svg', large: 'png-logos/CC.png' },
  CIT: { small: 'abrv-logos/CIT.svg', large: 'png-logos/CIT.png' },
  CSR: { small: 'abrv-logos/CSR.svg', large: 'png-logos/CSR.png' },
  FIC: { small: 'abrv-logos/FIC.svg', large: 'png-logos/FIC.png' },
  NCATS: { small: 'abrv-logos/NCATS.svg', large: 'png-logos/NCATS.png' },
  NCCIH: { small: 'abrv-logos/NCCIH.svg', large: 'png-logos/NCCIH.png' },
  NCI: { small: 'abrv-logos/NCI.svg', large: 'png-logos/NCI.png' },
  NEI: { small: 'abrv-logos/NEI.svg', large: 'png-logos/NEI.png' },
  NIEHS: { small: 'abrv-logos/NEIHS.svg', large: 'png-logos/NIEHS.png' },
  NHGRI: { small: 'abrv-logos/NHGRI.svg', large: 'png-logos/NHGRI.png' },
  NHLBI: { small: 'abrv-logos/NHLBI.svg', large: 'png-logos/NHLBI.png' },
  NIA: { small: 'abrv-logos/NIA.svg', large: 'png-logos/NIA.png' },
  NIAAA: { small: 'abrv-logos/NIAAA.svg', large: 'png-logos/NIAAA.png' },
  NIAID: { small: 'abrv-logos/NIAID.svg', large: 'png-logos/niaid.png' },
  NIAMS: { small: 'abrv-logos/NIAMS.svg', large: 'png-logos/NIAMSD.png' },
  NIBIB: { small: 'abrv-logos/NIBIB.svg', large: 'png-logos/NIBIB.png' },
  NICHD: { small: 'abrv-logos/NICHD.svg', large: 'png-logos/NICHHD.png' },
  NIDA: { small: 'abrv-logos/NIDA.svg', large: 'png-logos/NIDA.png' },
  NIDCD: { small: 'abrv-logos/NIDCD.svg', large: 'png-logos/NIDCD.png' },
  NIDCR: { small: 'abrv-logos/NIDCR.svg', large: 'png-logos/NIDCR.png' },
  NIDDK: { small: 'abrv-logos/NIDDK.svg', large: 'png-logos/NIDDK.png' },
  NIGMS: { small: 'abrv-logos/NIGMS.svg', large: 'png-logos/NIGMS.png' },
  NIMH: { small: 'abrv-logos/NIMH.svg', large: 'png-logos/NIMH.png' },
  NIMHD: { small: 'abrv-logos/NIMHD.svg', large: 'png-logos/NIMHHD.png' },
  NINDS: { small: 'abrv-logos/NINDS.svg', large: 'png-logos/NINDS.png' },
  NINR: { small: 'abrv-logos/NINR.svg', large: 'png-logos/NINR.png' },
  NLM: { small: 'abrv-logos/NLM.svg', large: 'png-logos/NLM.png' },
};

const NAV_LINKS = [
  { label: 'Resources', href: '#resources' },
  { label: 'Filters', href: '#filters' },
  { label: 'Support', href: '#support' },
];

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
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Filter by IC logo
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {options.map((option) => {
          const assets = getIcAssets(option);
          if (!assets.small) {
            return null;
          }
          const isActive = selected.includes(option);
          return (
            <button
              type="button"
              key={option}
              onClick={() => onToggle(option)}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border bg-white p-2 shadow-sm transition ${
                isActive
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img src={assets.small} alt={`${option} logo`} className="h-full w-full object-contain" />
            </button>
          );
        })}
      </div>
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


const App = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [selectedICs, setSelectedICs] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState([]);
  const [expandedResourceId, setExpandedResourceId] = useState(null);
  const [isHeroNavOpen, setIsHeroNavOpen] = useState(false);
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

    return subset;
  }, [
    resources,
    searchQuery,
    searchMatches,
    selectedICs,
    selectedDomains,
    selectedResourceTypes,
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
    setSelectedICs([]);
    setSelectedDomains([]);
    setSelectedResourceTypes([]);
  };

  const icLogoOptions = useMemo(
    () => filterOptions.ics.filter((ic) => Boolean(getIcAssets(ic).small)),
    [filterOptions.ics]
  );

  const handleCardToggle = (resourceId) => {
    setExpandedResourceId((current) => (current === resourceId ? null : resourceId));
  };

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

  return (
    <div className="page-shell">
      <header className="hero">
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
          <h1>Search, filter, and launch NIH-supported research infrastructure</h1>
          <p className="hero-subtitle">
            Explore data repositories, biospecimen banks, and analysis tools across NIH institutes. Use the
            curated filters, NIH logo picker, and fast semantic search to hone in on the resources that
            accelerate your work.
          </p>
          <div className="hero-stat-grid">
            <div className="hero-stat">
              <p className="hero-stat-value">{resources.length}</p>
              <p className="hero-stat-label">Total resources</p>
            </div>
            <div className="hero-stat">
              <p className="hero-stat-value">{filterOptions.ics.length}</p>
              <p className="hero-stat-label">Institutes</p>
            </div>
            <div className="hero-stat">
              <p className="hero-stat-value">{filterOptions.resourceTypes.length}</p>
              <p className="hero-stat-label">Resource types</p>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-quick-launch">
            <p className="hero-quick-kicker">Quick launch</p>
            <h2>Jump directly into the NIH explorer</h2>
            <p>
              Start with a blank search or skip down to the resource explorer whenever you are ready to browse
              the catalog.
            </p>
            <div className="hero-quick-actions">
              <button type="button" className="hero-quick-link" onClick={() => setSearchQuery('')}>
                <span>Clear current query</span>
                <span className="hero-quick-meta">Reset</span>
              </button>
              <a href="#resources" className="hero-quick-link hero-quick-link--primary">
                <span>Skip to explorer</span>
                <span className="hero-quick-meta">↓</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="resources" className="resources-panel text-slate-900">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <aside id="filters" className="lg:col-span-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
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
                  <LogoFilterGrid
                    options={icLogoOptions}
                    selected={selectedICs}
                    onToggle={(value) => toggleSelection(value, selectedICs, setSelectedICs)}
                  />

                  <MultiEntryInput
                    label="Maintaining IC"
                    placeholder="Type an IC code"
                    options={filterOptions.ics}
                    values={selectedICs}
                    onChange={setSelectedICs}
                  />

                  <MultiEntryInput
                    label="Domain"
                    placeholder="Add a domain"
                    options={filterOptions.domains}
                    values={selectedDomains}
                    onChange={setSelectedDomains}
                  />

                  <MultiEntryInput
                    label="Resource type"
                    placeholder="Add a resource type"
                    options={filterOptions.resourceTypes}
                    values={selectedResourceTypes}
                    onChange={setSelectedResourceTypes}
                  />
                </div>
                </div>
              </aside>

            <div className="space-y-4 lg:col-span-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                  <div className="flex-1">
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
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="text-sm font-semibold text-slate-900">{totalResults}</span>
                    results
                  </div>
                </div>
              </div>

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
