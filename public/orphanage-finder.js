const finderForm = document.querySelector('#orphanage-form');
const finderSteps = Array.from(document.querySelectorAll('.finder-step'));
const progressSteps = Array.from(document.querySelectorAll('[data-progress-step]'));
const nextButton = document.querySelector('#finder-next');
const backButton = document.querySelector('#finder-back');
const stepLabel = document.querySelector('#step-label');
const stepName = document.querySelector('#step-name');
const leadSheetOutput = document.querySelector('#lead-sheet-output');
const copyLeadButton = document.querySelector('#copy-lead-sheet');
const downloadLeadButton = document.querySelector('#download-lead-sheet');
const submitButton = document.querySelector('#finder-submit');
const finderStatus = document.querySelector('#finder-status');
const finderSuccess = document.querySelector('#finder-success');
const finderShell = document.querySelector('.finder-shell');
const caseReference = document.querySelector('#case-reference');
const finderStartedAt = Date.now();

const stepNames = ['About you', 'Russian identity', 'Institution', 'People & records', 'Adoption path', 'Review'];
let currentStep = 1;

const value = (name) => {
  const field = finderForm?.elements.namedItem(name);
  if (!field) return '';
  return String(field.value || '').trim();
};

const checkedValues = (name) => Array.from(finderForm?.querySelectorAll('input[name="' + name + '"]:checked') || []).map((field) => field.value);

const setFinderStatus = (message, state) => {
  if (!finderStatus) return;
  finderStatus.textContent = message;
  finderStatus.dataset.state = state || '';
};

const hasAny = (names) => names.some((name) => Boolean(value(name)));

const updateClueCoverage = () => {
  const checks = {
    location: hasAny(['birthPlace', 'birthRegion', 'formerPlaceName', 'institutionLocation', 'addressClue', 'placeNotes']),
    institution: hasAny(['institutionName', 'institutionNumber']) || (value('institutionType') && value('institutionType') !== 'Unknown'),
    people: hasAny(['directorName', 'doctorName', 'staffNames', 'officialNames']),
    timeline: hasAny(['dateOfBirth', 'yearsInCare', 'adoptionYear', 'adoptionAge', 'adoptionCourt']),
    records: checkedValues('records').length > 0 || hasAny(['documentClues', 'adoptionAgency'])
  };

  Object.entries(checks).forEach(([key, present]) => {
    const target = document.querySelector('[data-clue="' + key + '"]');
    if (!target) return;
    target.textContent = present ? 'Clue present' : 'Not provided';
    target.classList.toggle('present', present);
  });
};

const addLine = (lines, label, data) => {
  if (data) lines.push(label + ': ' + data);
};

const buildResearchQueries = () => {
  const queries = [];
  const place = value('institutionLocation') || value('birthPlace') || value('birthRegion');
  const institution = value('institutionName');
  const number = value('institutionNumber');
  const director = value('directorName');
  const doctor = value('doctorName');

  if (institution && place) queries.push('"' + institution + '" "' + place + '"');
  if (number && place) {
    queries.push('"' + place + '" "детский дом" "' + number + '"');
    queries.push('"' + place + '" "дом ребенка" "' + number + '"');
  }
  if (place) {
    queries.push('"' + place + '" "детский дом"');
    queries.push('"' + place + '" "дом ребенка"');
    queries.push('"' + place + '" "школа-интернат"');
  }
  if (director && place) queries.push('"' + director + '" "' + place + '" "детский дом"');
  if (doctor && place) queries.push('"' + doctor + '" "' + place + '" "дом ребенка"');

  return [...new Set(queries)].slice(0, 8);
};

const buildResearchRoutes = () => {
  const routes = [];
  if (hasAny(['birthPlace', 'birthRegion', 'formerPlaceName'])) routes.push('Confirm the historical and current administrative jurisdiction for the birthplace.');
  if (hasAny(['institutionName', 'institutionNumber', 'institutionLocation'])) routes.push('Search historical institution names, numbering, reorganizations, and successor organizations.');
  if (hasAny(['directorName', 'doctorName', 'staffNames', 'officialNames'])) routes.push('Cross-reference staff names with institutional, medical, education, and regional archival references.');
  if (value('adoptionCourt')) routes.push('Use the adoption court/jurisdiction as an anchor for the case file and local guardianship trail.');
  if (value('adoptionAgency')) routes.push('Identify whether the adoption agency or successor/custodian retains placement packets or institutional correspondence.');
  if (checkedValues('records').length) routes.push('Review the listed records for seals, issuing authorities, addresses, institution numbers, signatures, and untranslated headings.');
  if (!routes.length) routes.push('Begin by locating any adoption-era document, photograph, envelope, translation, or family note that contains a place, person, institution, or date.');
  return routes;
};

const buildLeadSheet = () => {
  if (!finderForm) return '';
  const lines = [];
  lines.push('RUSSIAN ADOPTEES ORGANIZATION — FIND MY ORPHANAGE');
  lines.push('Research lead sheet — DRAFT / NOT A VERIFIED MATCH');
  lines.push('');
  lines.push('SUBMITTER');
  addLine(lines, 'Name', value('requesterName'));
  addLine(lines, 'Email', value('email'));
  addLine(lines, 'Role', value('requesterRole'));
  lines.push('');
  lines.push('RUSSIAN IDENTITY & PLACE');
  addLine(lines, 'Birth / pre-adoption name', value('birthName'));
  addLine(lines, 'Cyrillic name', value('birthNameCyrillic'));
  addLine(lines, 'Date of birth / approximate date', value('dateOfBirth'));
  addLine(lines, 'Birthplace', value('birthPlace'));
  addLine(lines, 'Region', value('birthRegion'));
  addLine(lines, 'Former / alternate place name', value('formerPlaceName'));
  addLine(lines, 'Other identity clues', value('identityNotes'));
  lines.push('');
  lines.push('INSTITUTION');
  addLine(lines, 'Institution name', value('institutionName'));
  addLine(lines, 'Number / designation', value('institutionNumber'));
  addLine(lines, 'Type', value('institutionType'));
  addLine(lines, 'Location', value('institutionLocation'));
  addLine(lines, 'Approximate years in care', value('yearsInCare'));
  addLine(lines, 'Address clue', value('addressClue'));
  addLine(lines, 'Place / photograph / landmark clues', value('placeNotes'));
  lines.push('');
  lines.push('PEOPLE & RECORDS');
  addLine(lines, 'Director', value('directorName'));
  addLine(lines, 'Doctor / medical director', value('doctorName'));
  addLine(lines, 'Caregiver / teacher / staff', value('staffNames'));
  addLine(lines, 'Social worker / guardianship official', value('officialNames'));
  addLine(lines, 'Records on hand', checkedValues('records').join('; '));
  addLine(lines, 'Short document wording / stamps / phrases', value('documentClues'));
  lines.push('');
  lines.push('ADOPTION PATH');
  addLine(lines, 'Adoption year', value('adoptionYear'));
  addLine(lines, 'Age at adoption', value('adoptionAge'));
  addLine(lines, 'Court / jurisdiction', value('adoptionCourt'));
  addLine(lines, 'Adoption agency', value('adoptionAgency'));
  addLine(lines, 'Facilitator / translator / coordinator', value('facilitatorName'));
  addLine(lines, 'Adoptive destination', value('adoptiveDestination'));
  addLine(lines, 'Timeline / other adoption clues', value('adoptionNotes'));

  const queries = buildResearchQueries();
  lines.push('');
  lines.push('INVESTIGATOR SEARCH LEADS');
  if (queries.length) queries.forEach((query, index) => lines.push((index + 1) + '. ' + query));
  else lines.push('No targeted search strings yet — add a place, institution, number, or staff name to generate them.');

  lines.push('');
  lines.push('RECOMMENDED RESEARCH ROUTES');
  buildResearchRoutes().forEach((route, index) => lines.push((index + 1) + '. ' + route));
  lines.push('');
  lines.push('Important: Search strings and research routes are leads only. They do not establish that any institution or person is a verified match.');

  return lines.join('\n');
};

const refreshReview = () => {
  updateClueCoverage();
  if (leadSheetOutput) leadSheetOutput.textContent = buildLeadSheet();
};

const validateCurrentStep = () => {
  const step = finderSteps[currentStep - 1];
  if (!step) return true;
  const required = Array.from(step.querySelectorAll('[required]'));
  for (const field of required) {
    if (!field.checkValidity()) {
      field.reportValidity();
      field.focus();
      return false;
    }
  }
  return true;
};

const showStep = (stepNumber) => {
  currentStep = Math.max(1, Math.min(6, stepNumber));
  finderSteps.forEach((step, index) => {
    const active = index + 1 === currentStep;
    step.hidden = !active;
    step.classList.toggle('active', active);
  });
  progressSteps.forEach((item, index) => {
    const number = index + 1;
    item.classList.toggle('active', number === currentStep);
    item.classList.toggle('complete', number < currentStep);
    if (number === currentStep) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  if (stepLabel) stepLabel.textContent = 'Step ' + currentStep + ' of 6';
  if (stepName) stepName.textContent = stepNames[currentStep - 1];
  if (backButton) backButton.hidden = currentStep === 1;
  if (nextButton) nextButton.hidden = currentStep === 6;
  if (currentStep === 6) refreshReview();
  document.querySelector('#start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

nextButton?.addEventListener('click', () => {
  if (!validateCurrentStep()) return;
  showStep(currentStep + 1);
});

backButton?.addEventListener('click', () => showStep(currentStep - 1));

finderForm?.addEventListener('input', () => {
  if (currentStep === 6) refreshReview();
});

copyLeadButton?.addEventListener('click', async () => {
  const text = buildLeadSheet();
  try {
    await navigator.clipboard.writeText(text);
    copyLeadButton.textContent = 'Copied';
    window.setTimeout(() => { copyLeadButton.textContent = 'Copy lead sheet'; }, 1800);
  } catch {
    setFinderStatus('Your browser blocked clipboard access. You can select the lead sheet text manually.', 'error');
  }
});

downloadLeadButton?.addEventListener('click', () => {
  const blob = new Blob([buildLeadSheet()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'RAO-Orphanage-Research-Lead-Sheet.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

finderForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (currentStep !== 6) {
    showStep(6);
    return;
  }
  if (!validateCurrentStep() || !finderForm.reportValidity()) return;

  const locatorCluesPresent = hasAny([
    'birthPlace', 'birthRegion', 'institutionName', 'institutionNumber', 'institutionLocation',
    'directorName', 'doctorName', 'adoptionCourt', 'adoptionAgency', 'documentClues', 'placeNotes'
  ]);

  if (!locatorCluesPresent) {
    setFinderStatus('Please include at least one location, institution, staff, court, agency, document, or place clue before submitting.', 'error');
    return;
  }

  const payload = {
    requesterName: value('requesterName'),
    email: value('email'),
    requesterRole: value('requesterRole'),
    authorized: Boolean(finderForm.elements.namedItem('authorized')?.checked),
    birthName: value('birthName'),
    birthNameCyrillic: value('birthNameCyrillic'),
    dateOfBirth: value('dateOfBirth'),
    birthPlace: value('birthPlace'),
    birthRegion: value('birthRegion'),
    formerPlaceName: value('formerPlaceName'),
    identityNotes: value('identityNotes'),
    institutionName: value('institutionName'),
    institutionNumber: value('institutionNumber'),
    institutionType: value('institutionType'),
    institutionLocation: value('institutionLocation'),
    yearsInCare: value('yearsInCare'),
    addressClue: value('addressClue'),
    placeNotes: value('placeNotes'),
    directorName: value('directorName'),
    doctorName: value('doctorName'),
    staffNames: value('staffNames'),
    officialNames: value('officialNames'),
    records: checkedValues('records'),
    documentClues: value('documentClues'),
    adoptionYear: value('adoptionYear'),
    adoptionAge: value('adoptionAge'),
    adoptionCourt: value('adoptionCourt'),
    adoptionAgency: value('adoptionAgency'),
    facilitatorName: value('facilitatorName'),
    adoptiveDestination: value('adoptiveDestination'),
    adoptionNotes: value('adoptionNotes'),
    researchQueries: buildResearchQueries(),
    researchRoutes: buildResearchRoutes(),
    privacy: Boolean(finderForm.elements.namedItem('privacy')?.checked),
    noSensitiveNumbers: Boolean(finderForm.elements.namedItem('noSensitiveNumbers')?.checked),
    website: value('website'),
    startedAt: finderStartedAt
  };

  const originalText = submitButton?.textContent || 'Send research case to RAO';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending securely…';
    submitButton.setAttribute('aria-busy', 'true');
  }
  setFinderStatus('Sending your research case to RAO…', 'sending');

  try {
    const response = await fetch('/api/orphanage-case', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) throw new Error(data.error || 'We could not send your research case right now.');

    if (caseReference) caseReference.textContent = data.reference || 'RAO case';
    finderForm.hidden = true;
    document.querySelector('.finder-heading')?.setAttribute('hidden', '');
    document.querySelector('.finder-progress')?.setAttribute('hidden', '');
    if (finderSuccess) {
      finderSuccess.hidden = false;
      finderSuccess.focus();
    }
    setFinderStatus('Research case received.', 'success');
  } catch (error) {
    setFinderStatus((error.message || 'We could not send your research case right now.') + ' You can also contact RAO through the general contact page.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      submitButton.removeAttribute('aria-busy');
    }
  }
});

showStep(1);
