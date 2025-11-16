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

const FilterSection = ({ title, options, selected, onToggle }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
        {title}
      </h3>
      {selected.length > 0 && (
        <span className="text-[11px] font-medium text-indigo-600">
          {selected.length} selected
        </span>
      )}
    </div>
    <div className="mt-2 space-y-1 max-h-48 overflow-auto pr-2">
      {options.length === 0 ? (
        <p className="text-xs text-slate-400">No options</p>
      ) : (
        options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center space-x-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))
      )}
    </div>
  </div>
);

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

const ResourceCard = ({ resource, onSelect, isActive }) => (
  <div
    className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md cursor-pointer ${
      isActive ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 bg-white'
    }`}
    onClick={() => onSelect(resource)}
  >
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{resource.name}</h3>
        <p className="text-sm text-slate-500">
          {resource.shortName || resource.icName || resource.icCode}
        </p>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        {resource.icCode || 'IC'}
      </span>
    </div>
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
    {resource.typicalUseCases && (
      <p className="mt-3 text-sm text-slate-600">{resource.typicalUseCases}</p>
    )}
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      {resource.costStatus && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> {resource.costStatus}
        </span>
      )}
      {resource.accessModel && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> {resource.accessModel}
        </span>
      )}
    </div>
  </div>
);

const DetailPanel = ({ resource }) => {
  if (!resource) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Select a resource to view details.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{resource.name}</h2>
          <p className="text-sm text-slate-500">
            {resource.shortName || resource.icName || resource.icCode}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {resource.status || 'Active'}
        </span>
      </div>

      <div className="mt-6 grid gap-4 text-sm text-slate-700">
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Identity
          </span>
          <p className="font-medium text-slate-900">{resource.icName || 'Maintaining IC'}</p>
          <p className="text-slate-500">
            {resource.maintainingICs.length
              ? resource.maintainingICs.join(', ')
              : resource.icCode || 'Not specified'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Domains
          </span>
          <p>{resource.domains.join(', ') || 'Not specified'}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Access snapshot
        </h3>
        <div className="mt-3 grid gap-3 text-sm">
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

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Practical usage
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
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

      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Actionable links
        </h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <ExternalLink label="Primary URL" url={resource.primaryUrl} />
          <ExternalLink label="Docs" url={resource.docsUrl} />
          <ExternalLink label="API" url={resource.apiUrl} />
        </div>
      </div>

      {resource.keywords.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Keywords
          </h3>
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
        <div className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Notes</p>
          <p>{resource.notes}</p>
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
  const [selectedDataSensitivity, setSelectedDataSensitivity] = useState([]);
  const [selectedAccessModels, setSelectedAccessModels] = useState([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [activeResource, setActiveResource] = useState(null);
  const indexRef = useRef(null);

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
      dataSensitivity: uniqueSorted(resources.map((item) => item.dataSensitivity)),
      accessModels: uniqueSorted(resources.map((item) => item.accessModel)),
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

    if (selectedDataSensitivity.length) {
      subset = subset.filter((item) => selectedDataSensitivity.includes(item.dataSensitivity));
    }

    if (selectedAccessModels.length) {
      subset = subset.filter((item) => selectedAccessModels.includes(item.accessModel));
    }

    if (freeOnly) {
      subset = subset.filter((item) => (item.costStatus || '').toLowerCase().includes('free'));
    }

    if (openAccessOnly) {
      subset = subset.filter((item) =>
        (item.accessModel || '').toLowerCase().includes('open access')
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
    selectedDataSensitivity,
    selectedAccessModels,
    freeOnly,
    openAccessOnly,
  ]);

  useEffect(() => {
    if (!filteredResources.length) {
      setActiveResource(null);
      return;
    }

    setActiveResource((current) => {
      if (current && filteredResources.some((item) => item.id === current.id)) {
        return current;
      }
      return filteredResources[0];
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
    setSelectedDataSensitivity([]);
    setSelectedAccessModels([]);
    setFreeOnly(false);
    setOpenAccessOnly(false);
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
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
          NIH Resource Finder
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Search, filter, and launch NIH-supported research resources
            </h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Explore data repositories, biospecimen banks, and analysis tools. Use the instant
              search and curated filters to zero-in on what matters: institute alignment, domain
              focus, access model, and cost.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-3xl font-semibold text-slate-900">{resources.length}</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">Total resources</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr,360px]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Filters
            </h2>
            <button
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Access focus</p>
            <label className="mt-2 flex items-center justify-between">
              <span>Free only</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
              />
            </label>
            <label className="mt-2 flex items-center justify-between">
              <span>Open access only</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={openAccessOnly}
                onChange={(e) => setOpenAccessOnly(e.target.checked)}
              />
            </label>
          </div>

          <FilterSection
            title="Maintaining IC"
            options={filterOptions.ics}
            selected={selectedICs}
            onToggle={(value) => toggleSelection(value, selectedICs, setSelectedICs)}
          />

          <FilterSection
            title="Domain"
            options={filterOptions.domains}
            selected={selectedDomains}
            onToggle={(value) => toggleSelection(value, selectedDomains, setSelectedDomains)}
          />

          <FilterSection
            title="Resource type"
            options={filterOptions.resourceTypes}
            selected={selectedResourceTypes}
            onToggle={(value) => toggleSelection(value, selectedResourceTypes, setSelectedResourceTypes)}
          />

          <FilterSection
            title="Data sensitivity"
            options={filterOptions.dataSensitivity}
            selected={selectedDataSensitivity}
            onToggle={(value) => toggleSelection(value, selectedDataSensitivity, setSelectedDataSensitivity)}
          />

          <FilterSection
            title="Access model"
            options={filterOptions.accessModels}
            selected={selectedAccessModels}
            onToggle={(value) => toggleSelection(value, selectedAccessModels, setSelectedAccessModels)}
          />
        </aside>

        <main className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
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
                  isActive={activeResource?.id === resource.id}
                  onSelect={setActiveResource}
                />
              ))}
            </div>
          )}
        </main>

        <section className="sticky top-6 h-fit">
          <DetailPanel resource={activeResource} />
        </section>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
