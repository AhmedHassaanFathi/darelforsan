/**
 * ============================================================
 * محرك المنصة الرئيسي (التنقل، بناء الكروت، البحث، والفلترة)
 * منصة الاعتماد والتميز المؤسسي - مدارس دار الفرسان
 * ============================================================
 */

// حالة التطبيق والمتغيرات العامة والتنقل الهرمي
let currentTrackFilter = 'all';
let currentSearchTerm = '';
let currentLevel = 'domains'; // 'domains' | 'standards' | 'indicators'
let selectedDomainId = null;
let selectedStandardId = null;
let viewMode = 'step'; // 'step' (متدرج بالضغط: مجالات ➔ معايير ➔ مؤشرات) | 'all' (شامل)

function buildSidebarStandardsLists() {
      forsanAccreditationData.forEach(domain => {
        const container = document.getElementById('sidebarStandards-' + domain.id);
        if (!container) return;
        container.innerHTML = domain.standards.map(std => `
          <button onclick="navigateToStandard(${domain.id}, '${std.id}')"
            class="w-full text-right px-2.5 py-1.5 rounded-lg text-[11px] text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1.5">
            <span class="font-mono text-sky-400">${std.id}</span>
            <span class="truncate">${std.title}</span>
          </button>
        `).join('');
      });
    }

    function toggleSidebarStandards(domainId) {
      const list = document.getElementById('sidebarStandards-' + domainId);
      const chevron = document.getElementById('sidebarChevron-' + domainId);
      if (!list) return;
      list.classList.toggle('hidden');
      if (chevron) chevron.classList.toggle('rotate-180');
    }

function setSchoolStage(stageKey) {
      if (!schoolStagesConfig[stageKey]) return;
      currentSchoolStage = stageKey;
      const config = schoolStagesConfig[stageKey];

      // 1. تحديث أزرار تبويب المراحل العلوية
      ['primary', 'intermediate', 'secondary'].forEach(k => {
        const btn = document.getElementById('stageBtn_' + k);
        const sideBtn = document.getElementById('sideStageBtn_' + k);
        if (btn) {
          if (k === stageKey) {
            btn.className = "stage-tab-btn active px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 bg-brand-600 text-white border border-brand-400";
          } else {
            btn.className = "stage-tab-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 border border-white/10";
          }
        }
        if (sideBtn) {
          if (k === stageKey) {
            sideBtn.className = "flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all bg-brand-600 text-white text-xs";
          } else {
            sideBtn.className = "flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-xs font-medium";
          }
        }
      });

      // 2. تحديث روابط المجلدات في المجالات والمعايير لتطابق المرحلة المختارة
      forsanAccreditationData.forEach(domain => {
        if (config.domainFolders[domain.id]) {
          domain.driveFolder = config.domainFolders[domain.id];
        }
        domain.standards.forEach(std => {
          if (config.standardFolders[std.id]) {
            std.driveFolder = config.standardFolders[std.id];
          }
        });
      });

      // 3. تحديث شارة المرحلة في الرأس والبانر
      const stageHeaderBadge = document.getElementById('currentStageHeaderBadge');
      if (stageHeaderBadge) stageHeaderBadge.textContent = config.name;

      const stageTopDriveLink = document.getElementById('topStageDriveLink');
      if (stageTopDriveLink) {
        stageTopDriveLink.href = config.driveFolder;
        stageTopDriveLink.title = `فتح مجلد ${config.name} في Google Drive`;
      }

      const stageSelectorDriveLink = document.getElementById('stageSelectorDriveLink');
      if (stageSelectorDriveLink) {
        stageSelectorDriveLink.href = config.driveFolder;
        stageSelectorDriveLink.title = `فتح مجلد ${config.name} على Google Drive`;
      }

      // 4. إعادة التوجيه للرئيسية وإعادة الرسم وتحديث الرسوم البيانية
      navigateToHome();
      calculateTotalEvidenceCount();
      showToast(`تم الانتقال إلى: ${config.name} (المسار الأهلي)`);

      if (typeof initAccreditationCharts === 'function') {
        setTimeout(initAccreditationCharts, 150);
      }
    }


    function navigateToHome() {
      currentLevel = 'domains';
      selectedDomainId = null;
      selectedStandardId = null;
      updateSidebarActive();
      renderDashboard();
    }

    function navigateToDomain(domainId) {
      currentLevel = 'standards';
      selectedDomainId = Number(domainId);
      selectedStandardId = null;
      updateSidebarActive();
      renderDashboard();
    }

    function navigateToStandard(domainId, standardId, indicatorCode) {
      currentLevel = 'indicators';
      selectedDomainId = Number(domainId);
      selectedStandardId = standardId;
      updateSidebarActive();
      renderDashboard();
      if (indicatorCode) {
        scrollToIndicator(indicatorCode);
      }
    }

    function scrollToIndicator(code) {
      // بنستنى اللحظة اللي العناصر بتتعرض فيها فعلياً في الصفحة قبل ما نلف لها
      setTimeout(() => {
        const el = document.getElementById('indicator-' + code);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2'), 2200);
      }, 60);
    }

    function navigateBack() {
      if (currentLevel === 'indicators') {
        navigateToDomain(selectedDomainId);
      } else if (currentLevel === 'standards') {
        navigateToHome();
      }
    }

    function setViewMode(mode) {
      viewMode = mode;
      const stepBtn = document.getElementById('viewModeStepBtn');
      const allBtn = document.getElementById('viewModeAllBtn');

      if (mode === 'step') {
        stepBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-brand-700 shadow-2xs flex items-center gap-1.5";
        allBtn.className = "px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1.5";
      } else {
        allBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white text-brand-700 shadow-2xs flex items-center gap-1.5";
        stepBtn.className = "px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1.5";
      }
      renderDashboard();
    }

    function updateSidebarActive() {
      const items = document.querySelectorAll('.sidebar-item');
      items.forEach(el => {
        el.classList.remove('bg-brand-600', 'text-white', 'border-brand-400');
        el.classList.add('text-slate-300');
      });

      if (currentLevel === 'domains' || selectedDomainId === null) {
        const homeBtn = document.getElementById('sidebarHomeBtn');
        if (homeBtn) {
          homeBtn.classList.remove('text-slate-300');
          homeBtn.classList.add('bg-brand-600', 'text-white');
        }
      } else if (selectedDomainId) {
        const btn = document.getElementById(`sidebarDomainBtn-${selectedDomainId}`);
        if (btn) {
          btn.classList.remove('text-slate-300');
          btn.classList.add('bg-brand-600', 'text-white');
        }
      }
    }

    function updateBreadcrumb() {
      const container = document.getElementById('breadcrumbContainer');
      const backBtn = document.getElementById('navBackBtn');
      if (!container || !backBtn) return;

      const currentStageObj = (typeof schoolStagesConfig !== 'undefined' && schoolStagesConfig[currentSchoolStage])
        ? schoolStagesConfig[currentSchoolStage]
        : { name: 'المرحلة الابتدائية' };

      if (viewMode === 'all' || currentSearchTerm.trim().length > 0) {
        backBtn.classList.add('hidden');
        if (currentSearchTerm.trim().length > 0) {
          container.innerHTML = `
            <span class="inline-flex items-center gap-1.5 text-slate-800 font-bold">
              <span>🔍 نتائج البحث عن:</span>
              <span class="text-brand-600 font-mono">"${escapeHtml(currentSearchTerm)}"</span>
            </span>
          `;
        } else {
          container.innerHTML = `
            <span class="text-slate-700 font-bold">📋 العرض الشامل: كافة المجالات والمعايير والمؤشرات الـ 52</span>
          `;
        }
        return;
      }

      if (currentLevel === 'domains') {
        backBtn.classList.add('hidden');
        container.innerHTML = `
          <div class="flex items-center gap-2 flex-wrap">
            <span class="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">🏛️</span>
            <span class="text-slate-900 font-extrabold text-sm font-heading">المسار الأهلي</span>
            <span class="text-slate-300 font-bold">/</span>
            <span class="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
              <span id="activeStageNameBreadcrumb">${currentStageObj.name}</span>
            </span>
            <span class="text-slate-300 font-bold hidden sm:inline">•</span>
            <span class="text-[11px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono hidden sm:inline">اختر مجالاً للدخول لمعاييره وشواهده</span>
          </div>
        `;
      } else if (currentLevel === 'standards') {
        backBtn.classList.remove('hidden');
        const dom = forsanAccreditationData.find(d => d.id === selectedDomainId);
        container.innerHTML = `
          <button onclick="navigateToHome()" class="hover:text-brand-600 text-slate-500 flex items-center gap-1 transition-colors">
            <span>الرئيسية (${currentStageObj.name})</span>
          </button>
          <span class="text-slate-300">/</span>
          <span class="text-brand-700 font-bold bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
            المجال ${dom.number}: ${dom.title}
          </span>
        `;
      } else if (currentLevel === 'indicators') {
        backBtn.classList.remove('hidden');
        const dom = forsanAccreditationData.find(d => d.id === selectedDomainId);
        const std = dom ? dom.standards.find(s => s.id === selectedStandardId) : null;
        container.innerHTML = `
          <button onclick="navigateToHome()" class="hover:text-brand-600 text-slate-500 transition-colors">الرئيسية (${currentStageObj.name})</button>
          <span class="text-slate-300">/</span>
          <button onclick="navigateToDomain(${dom.id})" class="hover:text-brand-600 text-slate-600 font-bold transition-colors">
            المجال ${dom.number}: ${dom.title}
          </button>
          <span class="text-slate-300">/</span>
          <span class="text-brand-700 font-bold bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
            معيار ${std ? std.id : ''}: ${std ? std.title : ''}
          </span>
        `;
      }
    }

    function calculateTotalEvidenceCount() {
      let total = 0;
      forsanAccreditationData.forEach(d => {
        d.standards.forEach(s => {
          s.indicators.forEach(i => {
            total += (i.evidences ? i.evidences.length : 0);
            if (i.subFolders) {
              i.subFolders.forEach(sf => {
                total += (sf.files ? sf.files.length : 0);
              });
            }
          });
        });
      });
      const badge = document.getElementById('totalEvidencesCountBadge');
      if (badge) badge.textContent = `${total} شاهد رقمي ومجلد معتمد`;
    }

    // ==========================================
    // دالة العرض الرئيسية (Main Dashboard Render)
    // ==========================================
    function renderDashboard() {
      const container = document.getElementById('domainsMainContainer');
      const noResults = document.getElementById('noResultsState');
      const filterAlert = document.getElementById('filterStatusAlert');
      const summaryText = document.getElementById('filterSummaryText');

      container.innerHTML = '';
      updateBreadcrumb();
      noResults.classList.add('hidden');

      // 1. حالة البحث النشط: نعرض نتائج البحث فوراً من كل المستويات
      if (currentSearchTerm.trim().length > 0) {
        renderSearchResults(container, noResults, filterAlert, summaryText);
        return;
      }

      filterAlert.classList.add('hidden');

      // 2. حالة العرض الشامل (عرض كل شيء في صفحة واحدة لمن يفضل ذلك)
      if (viewMode === 'all') {
        renderAllExpanded(container, noResults);
        return;
      }

      // 3. العرض الهرمي المتدرج (المطلوب: اسم المعيار الأساسي ➔ الضغط عليه يدخل للمعايير ➔ ثم المؤشرات والشواهد)
      if (currentLevel === 'domains') {
        renderLevel1Domains(container);
      } else if (currentLevel === 'standards') {
        renderLevel2Standards(container, selectedDomainId);
      } else if (currentLevel === 'indicators') {
        renderLevel3Indicators(container, selectedDomainId, selectedStandardId);
      }
    }

    // ------------------------------------------
    // المستوى 1: المجالات الأربعة الأساسية (Domain Cards)
    // ------------------------------------------
    function renderLevel1Domains(container) {
      const wrapper = document.createElement('div');
      wrapper.className = "space-y-6";

      const headerBox = document.createElement('div');
      headerBox.className = "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-navy to-slate-900 text-white shadow-soft relative overflow-hidden";
      headerBox.innerHTML = `
        <div class="relative z-10 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-dot"></span>
            <span class="text-xs font-bold text-sky-200 uppercase tracking-wider">هيكل الاعتماد المدرسي الوطني (ETEC) • المرحلة الابتدائية (بنين)</span>
          </div>
          <h3 class="text-xl sm:text-2xl font-black font-heading text-white">المجالات الأساسية الأربعة للاعتماد المؤسسي</h3>
          <p class="text-xs text-slate-300 max-w-2xl leading-relaxed">
            اختر المجال المطلوب للاطلاع على معاييره ومؤشراته وتقاريره الموثقة المربوطة سحابياً مع Google Drive:
          </p>
        </div>
        <div class="relative z-10 flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <span class="px-3.5 py-1.5 rounded-xl bg-white/10 text-white font-bold text-xs border border-white/15 shadow-2xs">
            4 مجالات رئيسية
          </span>
          <span class="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 shadow-2xs">
            122 ملفاً وشاهداً معتمداً
          </span>
        </div>
      `;
      wrapper.appendChild(headerBox);

      // شبكة كروت المجالات الأربعة بتصميم عصري ورسومات متقنة
      const grid = document.createElement('div');
      grid.className = "grid grid-cols-1 md:grid-cols-2 gap-6";

      // رسومات فيكتور مخصصة لكل مجال
      const domainVisuals = {
        1: {
          gradient: 'from-slate-900 via-sky-950 to-brand-navy',
          accent: 'text-sky-400',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          hoverBorder: 'hover:border-sky-500',
          btnBg: 'bg-gradient-to-r from-sky-600 to-brand-600 hover:from-sky-700 hover:to-brand-700',
          evidencesCount: 48,
          svgIllustration: `<svg viewBox="0 0 120 120" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="54" fill="url(#g1)" fill-opacity="0.15" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 4"/>
            <path d="M60 22 L88 36 L88 64 C88 80 60 96 60 96 C60 96 32 80 32 64 L32 36 Z" fill="url(#g1_shield)" stroke="#0284c7" stroke-width="2.5"/>
            <path d="M48 58 L56 66 L74 48" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="52" y="76" width="16" height="4" rx="2" fill="#38bdf8"/>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="#0284c7"/><stop offset="1" stop-color="#0b253a"/></linearGradient>
              <linearGradient id="g1_shield" x1="32" y1="22" x2="88" y2="96" gradientUnits="userSpaceOnUse"><stop stop-color="#0284c7"/><stop offset="1" stop-color="#0369a1"/></linearGradient>
            </defs>
          </svg>`
        },
        2: {
          gradient: 'from-slate-900 via-teal-950 to-emerald-950',
          accent: 'text-emerald-400',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          hoverBorder: 'hover:border-emerald-500',
          btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
          evidencesCount: 26,
          svgIllustration: `<svg viewBox="0 0 120 120" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="54" fill="url(#g2)" fill-opacity="0.15" stroke="#34d399" stroke-width="1.5" stroke-dasharray="4 4"/>
            <path d="M60 28 L94 44 L60 60 L26 44 Z" fill="#10b981" stroke="#059669" stroke-width="2"/>
            <path d="M38 52 L38 72 C38 72 46 84 60 84 C74 84 82 72 82 72 L82 52" stroke="#10b981" stroke-width="2.5" fill="none"/>
            <path d="M88 48 L88 74" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="88" cy="77" r="3" fill="#f59e0b"/>
            <path d="M44 88 C44 88 52 94 60 94 C68 94 76 88 76 88" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>
            <defs><linearGradient id="g2" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="#10b981"/><stop offset="1" stop-color="#064e3b"/></linearGradient></defs>
          </svg>`
        },
        3: {
          gradient: 'from-slate-900 via-indigo-950 to-blue-950',
          accent: 'text-indigo-400',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          hoverBorder: 'hover:border-indigo-500',
          btnBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700',
          evidencesCount: 28,
          svgIllustration: `<svg viewBox="0 0 120 120" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="54" fill="url(#g3)" fill-opacity="0.15" stroke="#818cf8" stroke-width="1.5" stroke-dasharray="4 4"/>
            <path d="M32 86 L48 68 L64 74 L88 44" stroke="#6366f1" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="88" cy="44" r="5" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
            <rect x="30" y="86" width="10" height="12" rx="2" fill="#818cf8" fill-opacity="0.4"/>
            <rect x="46" y="76" width="10" height="22" rx="2" fill="#818cf8" fill-opacity="0.6"/>
            <rect x="62" y="68" width="10" height="30" rx="2" fill="#818cf8" fill-opacity="0.8"/>
            <rect x="78" y="52" width="10" height="46" rx="2" fill="#6366f1"/>
            <defs><linearGradient id="g3" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient></defs>
          </svg>`
        },
        4: {
          gradient: 'from-slate-900 via-amber-950 to-slate-900',
          accent: 'text-amber-400',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          hoverBorder: 'hover:border-amber-500',
          btnBg: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
          evidencesCount: 20,
          svgIllustration: `<svg viewBox="0 0 120 120" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="54" fill="url(#g4)" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 4"/>
            <path d="M28 88 L28 52 L60 30 L92 52 L92 88 Z" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
            <rect x="40" y="60" width="12" height="12" rx="2" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
            <rect x="68" y="60" width="12" height="12" rx="2" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
            <path d="M54 88 L54 74 L66 74 L66 88" stroke="#d97706" stroke-width="2" fill="#fbbf24"/>
            <circle cx="60" cy="46" r="6" fill="#10b981"/>
            <path d="M57 46 L59 48 L63 44" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            <defs><linearGradient id="g4" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop stop-color="#d97706"/><stop offset="1" stop-color="#451a03"/></linearGradient></defs>
          </svg>`
        }
      };

      forsanAccreditationData.forEach(domain => {
        const visual = domainVisuals[domain.id] || domainVisuals[1];

        let totalEvidencesInDomain = 0;
        domain.standards.forEach(s => s.indicators.forEach(i => totalEvidencesInDomain += i.evidences.length));

        const card = document.createElement('div');
        card.className = `group cursor-pointer bg-white rounded-3xl border border-slate-200/90 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col justify-between ${visual.hoverBorder} domain-card-glow`;
        card.onclick = () => navigateToDomain(domain.id);

        card.innerHTML = `
          <div>
            <!-- رأس الكارت: رسمة فيكتور فخمة وهوية المجال -->
            <div class="p-6 bg-gradient-to-br ${visual.gradient} rounded-t-3xl text-white relative overflow-hidden">
              <div class="absolute -left-4 -bottom-4 w-32 h-32 opacity-85 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 pointer-events-none">
                ${visual.svgIllustration}
              </div>

              <div class="relative z-10">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <span class="text-xs font-black px-3 py-1 rounded-xl bg-white/15 text-white backdrop-blur-md border border-white/20 font-mono">
                    المجال ${domain.number}
                  </span>
                  <span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
                    مستوفى 100%
                  </span>
                </div>

                <h4 class="text-xl sm:text-2xl font-black font-heading text-white mb-2 group-hover:text-amber-300 transition-colors">
                  ${domain.title}
                </h4>

                <div class="flex items-center gap-2 flex-wrap text-xs text-slate-200">
                  <span class="px-2.5 py-0.5 rounded-lg bg-white/10 font-medium">• ${domain.standards.length} معايير فرعية</span>
                  <span class="px-2.5 py-0.5 rounded-lg bg-white/10 font-medium">• ${domain.indicatorsCount} مؤشر أداء</span>
                  <span class="px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-200 font-bold border border-amber-400/30 font-mono">• ${totalEvidencesInDomain} شاهد حقيقي</span>
                </div>
              </div>
            </div>

            <!-- محتوى الكارت وقائمة المعايير -->
            <div class="p-6 space-y-4">
              <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">
                ${domain.desc}
              </p>

              <!-- شريط مؤشر الجاهزية -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between text-[11px] font-bold">
                  <span class="text-slate-500">جاهزية التوثيق والامتثال:</span>
                  <span class="text-emerald-600 font-mono">100% (مكتمل)</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-full"></div>
                </div>
              </div>

              <!-- المعايير المعتمدة داخل هذا المجال -->
              <div class="space-y-2 pt-2 border-t border-slate-100">
                <span class="text-[11px] font-bold text-slate-400 block">المعايير المعتمدة في هذا المجال:</span>
                <div class="flex flex-wrap gap-1.5">
                  ${domain.standards.map(std => `
                    <button type="button" onclick="event.stopPropagation(); navigateToStandard(${domain.id}, '${std.id}')"
                      title="الذهاب مباشرة لمعيار ${escapeAttr(std.title)}"
                      class="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-brand-100 hover:text-brand-700 transition-colors flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                      ${escapeHtml(std.title)}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- ذيل الكارت مع أزرار الإجراء السريع -->
          <div class="p-4 sm:px-6 bg-slate-50/70 border-t border-slate-100 rounded-b-3xl flex items-center justify-between gap-3">
            <a 
              href="${domain.driveFolder || 'https://drive.google.com/drive/folders/1VDoRMHx_TfYHfPGFrK0_QiGM-7kTeHfu'}" 
              target="_blank" 
              onclick="event.stopPropagation();" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs hover:scale-102"
              title="فتح مجلد هذا المجال مباشرة على Google Drive"
            >
              <svg class="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>
              <span>مجلد المجال في Drive ↗</span>
            </a>

            <button 
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl ${visual.btnBg} text-white font-bold text-xs shadow-xs group-hover:shadow-md transition-all group-hover:scale-102"
            >
              <span>استعراض المعايير</span>
              <svg class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        `;

        grid.appendChild(card);
      });

      wrapper.appendChild(grid);
      container.appendChild(wrapper);
    }

    function renderLevel2Standards(container, domainId) {
      const domain = forsanAccreditationData.find(d => d.id === domainId);
      if (!domain) {
        navigateToHome();
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = "space-y-6";

      // رأس المجال المحدد
      const header = document.createElement('div');
      header.className = "p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4";
      header.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black font-heading text-xl shadow-sm shrink-0">
            ${domain.number}
          </span>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200">المجال الأساسي ${domain.number}</span>
              <h3 class="text-lg sm:text-2xl font-black font-heading text-white">${domain.title}</h3>
            </div>
            <p class="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">${domain.desc}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a 
            href="${domain.driveFolder || 'https://drive.google.com/drive/folders/1tk3kKglwXs_RatjneY_fIX_d-amGaIG4'}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-1.5"
            title="فتح مجلد شواهد هذا المجال على Google Drive"
          >
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>
            <span>مجلد درايف ↗</span>
          </a>
          <button onclick="navigateToHome()" class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            <span>كل المجالات</span>
          </button>
        </div>
      `;
      wrapper.appendChild(header);

      // تعليمات التصفح
      const tipBox = document.createElement('div');
      tipBox.className = "p-4 rounded-2xl bg-sky-50 border border-sky-200 text-brand-900 text-xs flex items-center justify-between";
      tipBox.innerHTML = `
        <div class="flex items-center gap-2 font-bold">
          <span class="text-brand-600 text-base">📑</span>
          <span>يتضمن هذا المجال (${domain.standards.length}) معايير رئيسية. اضغط على أي معيار للدخول إلى مؤشراته وشواهده:</span>
        </div>
        <span class="text-slate-500 font-mono text-[11px]">${domain.indicatorsCount} مؤشراً إجمالياً</span>
      `;
      wrapper.appendChild(tipBox);

      // شبكة كروت المعايير
      const grid = document.createElement('div');
      grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5";

      domain.standards.forEach((std, index) => {
        let totalEvidencesInStd = 0;
        std.indicators.forEach(ind => {
          totalEvidencesInStd += ind.evidences.length;
        });

        const card = document.createElement('div');
        card.className = "group cursor-pointer bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-500 shadow-soft hover:shadow-card transition-all duration-200 flex flex-col justify-between transform hover:-translate-y-1";
        card.onclick = () => navigateToStandard(domain.id, std.id);

        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                معيار ${std.id}
              </span>
              <span class="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center font-bold text-xs text-slate-600 transition-colors">
                ${index + 1}
              </span>
            </div>

            <h4 class="text-base font-bold text-slate-900 font-heading mb-2 group-hover:text-brand-700 transition-colors">
              ${std.title}
            </h4>

            <div class="space-y-1 mb-5">
              <div class="flex items-center justify-between text-xs text-slate-500">
                <span>المؤشرات المعتمدة:</span>
                <strong class="text-slate-800 font-mono">${std.indicators.length} مؤشر</strong>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-500">
                <span>شواهد الإثبات الموثقة:</span>
                <strong class="text-brand-600 font-mono">${totalEvidencesInStd} شاهد</strong>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-500">
                <span>نسبة الاستيفاء:</span>
                <span class="text-emerald-600 font-bold font-mono">100% مستوفى</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[11px] text-slate-400 group-hover:text-brand-600 transition-colors">انقر للعرض</span>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:text-brand-700">
              <span>عرض المؤشرات</span>
              <svg class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </span>
          </div>
        `;

        grid.appendChild(card);
      });

      wrapper.appendChild(grid);
      container.appendChild(wrapper);
    }

    // ------------------------------------------
    // المستوى 3: المؤشرات والشواهد التابعة للمعيار (Indicators & Evidences Level)
    // ------------------------------------------
    function renderLevel3Indicators(container, domainId, standardId) {
      const domain = forsanAccreditationData.find(d => d.id === domainId);
      const standard = domain ? domain.standards.find(s => s.id === standardId) : null;

      if (!domain || !standard) {
        navigateToHome();
        return;
      }

      // تصفية مؤشرات المعيار بناءً على المسار المختار
      const matchingIndicators = standard.indicators.filter(ind => {
        return (currentTrackFilter === 'all') || (ind.track === currentTrackFilter) || (ind.track === 'all');
      });

      const wrapper = document.createElement('div');
      wrapper.className = "space-y-6";

      // رأس المعيار
      const header = document.createElement('div');
      header.className = "p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4";
      header.innerHTML = `
        <div class="flex items-start gap-4">
          <span class="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black font-heading text-lg shadow-sm shrink-0">
            ${standard.id}
          </span>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200">
                المجال ${domain.number}: ${domain.title}
              </span>
              <h3 class="text-lg sm:text-2xl font-black font-heading text-white">معيار: ${standard.title}</h3>
            </div>
            <p class="text-xs text-slate-300 mt-1">يحتوي هذا المعيار على (${matchingIndicators.length}) مؤشرات وشواهد إثبات رقمية معتمدة.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a 
            href="${domain.driveFolder || 'https://drive.google.com/drive/folders/1tk3kKglwXs_RatjneY_fIX_d-amGaIG4'}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-1.5"
            title="فتح مجلد شواهد هذا المجال على Google Drive"
          >
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>
            <span>مجلد درايف ↗</span>
          </a>
          ${standard.driveFolder ? `
          <a 
            href="${standard.driveFolder}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-1.5"
            title="فتح مجلد شواهد هذا المعيار على Google Drive"
          >
            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>
            <span>مجلد المعيار في Drive ↗</span>
          </a>
          ` : ''}
          <button onclick="navigateToDomain(${domain.id})" class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            <span>معايير المجال</span>
          </button>
        </div>
      `;
      wrapper.appendChild(header);

      // بطاقات المؤشرات والشواهد
      const listContainer = document.createElement('div');
      listContainer.className = "space-y-4";

      if (matchingIndicators.length === 0) {
        listContainer.innerHTML = `
          <div class="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <p class="text-sm font-bold text-slate-700">لا توجد مؤشرات في هذا المعيار خاصة بالمسار المختار حالياً.</p>
            <button onclick="setTrackFilter('all')" class="mt-3 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold">
              عرض جميع المسارات
            </button>
          </div>
        `;
      } else {
        matchingIndicators.forEach(ind => {
          listContainer.innerHTML += createIndicatorCard(ind, standard, domain);
        });
      }

      wrapper.appendChild(listContainer);
      container.appendChild(wrapper);
    }

    // ------------------------------------------
    // عرض نتائج البحث اللحظي (Search Results)
    // ------------------------------------------
    function renderSearchResults(container, noResults, filterAlert, summaryText) {
      filterAlert.classList.remove('hidden');
      const q = currentSearchTerm.toLowerCase().trim();
      let matchedCount = 0;

      const resultsWrapper = document.createElement('div');
      resultsWrapper.className = "space-y-4";

      forsanAccreditationData.forEach(domain => {
        domain.standards.forEach(std => {
          std.indicators.forEach(ind => {
            const matchTrack = (currentTrackFilter === 'all') || (ind.track === currentTrackFilter) || (ind.track === 'all');
            const inCode = ind.code.toLowerCase().includes(q);
            const inTitle = ind.title.toLowerCase().includes(q);
            const inDesc = ind.desc.toLowerCase().includes(q);
            const inStd = std.title.toLowerCase().includes(q);
            const inDomain = domain.title.toLowerCase().includes(q);
            const inEv = ind.evidences.some(e => e.title.toLowerCase().includes(q) || (e.fileName && e.fileName.toLowerCase().includes(q)));

            if (matchTrack && (inCode || inTitle || inDesc || inStd || inDomain || inEv)) {
              matchedCount++;

              // إنشاء بطاقة النتيجة مع شارة المسار الهرمي
              const resultCard = document.createElement('div');
              resultCard.className = "space-y-2";
              resultCard.innerHTML = `
                <div class="flex items-center justify-between text-xs font-semibold px-2">
                  <div class="flex items-center gap-1.5 text-slate-500">
                    <span class="text-slate-700 font-bold">المجال ${domain.number}: ${domain.title}</span>
                    <span>›</span>
                    <span class="text-brand-700 font-bold">معيار ${std.id}: ${std.title}</span>
                  </div>
                  <button onclick="jumpToSearchResult(${domain.id}, '${std.id}', '${ind.code}')" class="text-brand-600 hover:text-brand-700 hover:underline font-bold text-xs flex items-center gap-1">
                    <span>فتح داخل الشجرة</span>
                    <span>←</span>
                  </button>
                </div>
                ${createIndicatorCard(ind, std, domain)}
              `;
              resultsWrapper.appendChild(resultCard);
            }
          });
        });
      });

      summaryText.textContent = `${matchedCount} مؤشراً وشاهداً مطابقاً لكلمة البحث`;

      if (matchedCount === 0) {
        noResults.classList.remove('hidden');
      } else {
        noResults.classList.add('hidden');
        container.appendChild(resultsWrapper);
      }
    }

    function jumpToSearchResult(domainId, standardId, indicatorCode) {
      clearGlobalSearch();
      navigateToStandard(domainId, standardId, indicatorCode);
    }

    // ------------------------------------------
    // العرض الشامل المفتوح (All Expanded View)
    // ------------------------------------------
    function renderAllExpanded(container, noResults) {
      let matchedCount = 0;
      forsanAccreditationData.forEach(domain => {
        const matchingStandards = [];
        domain.standards.forEach(std => {
          const matchingIndicators = std.indicators.filter(ind => {
            return (currentTrackFilter === 'all') || (ind.track === currentTrackFilter) || (ind.track === 'all');
          });
          if (matchingIndicators.length > 0) {
            matchingStandards.push({ ...std, indicators: matchingIndicators });
            matchedCount += matchingIndicators.length;
          }
        });

        if (matchingStandards.length > 0) {
          const domainCard = createFullDomainSection(domain, matchingStandards);
          container.appendChild(domainCard);
        }
      });

      if (matchedCount === 0) {
        noResults.classList.remove('hidden');
      } else {
        noResults.classList.add('hidden');
      }
    }

    function createFullDomainSection(domain, standards) {
      const el = document.createElement('section');
      el.id = `domain-section-${domain.id}`;
      el.className = "bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden transition-all";

      const totalInd = standards.reduce((acc, s) => acc + s.indicators.length, 0);

      el.innerHTML = `
        <div class="px-6 py-4.5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
          <div class="flex items-center gap-3.5">
            <span class="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black font-heading text-base shadow-sm">
              ${domain.number}
            </span>
            <div>
              <div class="flex items-center gap-2.5">
                <h3 class="text-base sm:text-lg font-black font-heading text-white">المجال ${domain.number}: ${domain.title}</h3>
                <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-sky-200 border border-white/10">
                  ${totalInd} مؤشراً
                </span>
              </div>
              <p class="text-xs text-slate-300 mt-0.5">${domain.desc}</p>
            </div>
          </div>
          <button onclick="navigateToDomain(${domain.id})" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors">
            استعراض متدرج ←
          </button>
        </div>

        <div class="p-6 space-y-6">
          ${standards.map(std => `
            <div class="space-y-3.5">
              <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
                  <h4 class="text-sm font-bold text-slate-800 font-heading">معيار: ${std.title}</h4>
                  <span class="text-xs text-slate-400 font-mono">(${std.id})</span>
                </div>
                <button onclick="navigateToStandard(${domain.id}, '${std.id}')" class="text-xs font-bold text-brand-600 hover:underline">
                  فتح هذا المعيار منفصلاً ←
                </button>
              </div>
              <div class="grid grid-cols-1 gap-3.5">
                ${std.indicators.map(ind => createIndicatorCard(ind, std, domain)).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      return el;
    }

    // ==========================================
    // إنشاء بطاقة المؤشر والشواهد (Indicator & Evidence Card)
    // ==========================================
    function createIndicatorCard(ind, std, domain) {
      return `
        <div id="indicator-${ind.code}" style="scroll-margin-top: 110px;" class="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-brand-300 hover:shadow-card transition-all duration-200">
          
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-black px-2 py-0.5 rounded-md bg-brand-navy text-white font-mono shadow-2xs">
                  ${ind.code}
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-brand-800">
                  ${ind.trackLabel}
                </span>
                <h5 class="text-sm font-bold text-slate-900">${ind.title}</h5>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed max-w-4xl">${ind.desc}</p>
            </div>

            <div class="shrink-0 flex items-center gap-2 self-start flex-wrap">
              <span class="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full ${ind.evidences.length > 0 ? 'bg-emerald-500' : 'bg-amber-400'}"></span>
                ${ind.evidences.length + (ind.subFolders ? ind.subFolders.reduce((acc, f) => acc + (f.files ? f.files.length : 0), 0) : 0)} شواهد موثقة
              </span>
              ${ind.folderUrl ? `
              <a 
                href="${ind.folderUrl}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs hover:scale-102"
                title="فتح مجلد هذا المؤشر بالكامل على Google Drive"
              >
                <svg class="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/></svg>
                <span>مجلد المؤشر في Drive ↗</span>
              </a>
              ` : ''}
            </div>
          </div>

          ${ind.note ? `
          <!-- ملاحظة نطاق التطبيق (مؤشر خاص بمسار معين) -->
          <div class="mt-3.5 pt-3 border-t border-slate-200/60">
            <div class="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold leading-relaxed">
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>${escapeHtml(ind.note)}</span>
            </div>
          </div>
          ` : `
          <!-- شبكة شواهد الإثبات المعتمدة مع إمكانية المعاينة، الفتح في Drive، وتعديل الرابط -->
          <div class="mt-3.5 pt-3 border-t border-slate-200/60">
            <div class="text-[11px] font-bold text-slate-500 mb-2.5 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                <span>شواهد وتقارير المؤشر المعتمدة (${ind.evidences.length}):</span>
              </div>
              <span class="text-[10px] text-slate-400">انقر للمعاينة بالمنصة • زر ↗ لفتح الملف في Google Drive</span>
            </div>

            <!-- بطاقات الشواهد المعتمدة (التقرير PDF يظهر أولاً) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2.5">
              ${(() => {
          const sortedEvidences = [...ind.evidences].sort((a, b) => (a.type === 'pdf' ? -1 : (b.type === 'pdf' ? 1 : 0)));
          if (sortedEvidences.length === 0) {
            return `
                    <div class="col-span-full p-4 rounded-xl bg-slate-100/80 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      <p class="font-bold text-slate-700 mb-1">المجلد جاهز ومربوط على Google Drive</p>
                      <p class="mb-2 text-[11px]">في انتظار رفع تقارير وشواهد هذا المؤشر في درايف</p>
                      ${ind.folderUrl ? `<a href="${ind.folderUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-brand-700 font-bold hover:bg-brand-50 transition-colors shadow-2xs">
                        <span>📂 فتح مجلد المؤشر في Drive لرفع الملفات ↗</span>
                      </a>` : ''}
                    </div>
                  `;
          }
          return sortedEvidences.map(ev => {
            const isCustom = isCustomDriveLink(ind.code, ev.title);
            const effectiveId = getEffectiveDriveId(ind.code, ev.title, ev.driveId);
            const driveDirectUrl = buildDriveExternalUrl(effectiveId);
            const isPdfReport = ev.type === 'pdf';

            return `
                    <div class="group/item relative flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-all ${isPdfReport ? 'border-red-200 bg-gradient-to-l from-red-50/50 via-white to-white hover:border-red-400 hover:shadow-card' : isCustom ? 'border-brand-400 bg-brand-50/40 shadow-xs' : 'border-slate-200/90 bg-white hover:border-brand-300 hover:shadow-sm'}">
                      
                      <!-- معلومات الشاهد وزر المعاينة السريعة -->
                      <button
                        data-ev="${escapeAttr(JSON.stringify({ title: ev.title, fileName: ev.fileName, code: ind.code, type: ev.type, driveId: ev.driveId, date: ev.date, issuer: ev.issuer, track: ind.trackLabel }))}"
                        onclick="openEvidenceModalFromData(this)"
                        class="flex items-center gap-3 min-w-0 text-right flex-grow"
                        title="انقر لمعاينة ${isPdfReport ? 'تقرير الشواهد' : 'الملف'} داخل المنصة"
                      >
                        <span class="w-9 h-9 rounded-lg ${getIconBg(ev.type)} flex items-center justify-center shrink-0 shadow-2xs group-hover/item:scale-105 transition-transform">
                          ${getIcon(ev.type)}
                        </span>
                        <div class="min-w-0">
                          <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-xs font-black text-slate-800 truncate block group-hover/item:text-brand-700 transition-colors">
                              ${escapeHtml(ev.title)}
                            </span>
                            ${isPdfReport ? `<span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700">معتمد ورسمي</span>` : ''}
                          </div>
                          <div class="flex items-center gap-1.5 mt-0.5">
                            <span class="text-[10px] ${isPdfReport ? 'text-red-600' : 'text-emerald-600'} font-bold flex items-center gap-1">
                              <span class="w-1.5 h-1.5 rounded-full ${isPdfReport ? 'bg-red-500' : 'bg-emerald-500'}"></span>
                              ${isPdfReport ? 'تقرير شواهد PDF' : 'ملف في Drive'}
                            </span>
                            ${ev.fileName ? `<span class="text-[9px] text-slate-400 font-mono truncate max-w-[140px] hidden sm:inline" title="${escapeAttr(ev.fileName)}">${escapeHtml(ev.fileName)}</span>` : ''}
                          </div>
                        </div>
                      </button>

                      <!-- أزرار الإجراءات السريعة -->
                      <div class="flex items-center gap-1 shrink-0">
                        <!-- زر المعاينة بالمنصة -->
                        <button
                          data-ev="${escapeAttr(JSON.stringify({ title: ev.title, fileName: ev.fileName, code: ind.code, type: ev.type, driveId: ev.driveId, date: ev.date, issuer: ev.issuer, track: ind.trackLabel }))}"
                          onclick="openEvidenceModalFromData(this)"
                          class="px-2.5 py-1.5 rounded-lg ${isPdfReport ? 'bg-red-50 hover:bg-red-600 hover:text-white text-red-700' : 'bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700'} text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                          title="معاينة الشاهد فوراً داخل المنصة"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          <span>معاينة</span>
                        </button>

                        <!-- فتح الملف مباشرة في Google Drive -->
                        <a
                          href="${driveDirectUrl}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="فتح الملف مباشرة في Google Drive ↗"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>

                        <!-- زر الإعدادات / تعديل الرابط -->
                        <button
                          onclick="openEditDriveLinkModal('${ind.code}', '${escapeAttr(ev.title)}', '${ev.driveId}')"
                          class="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="تعديل رابط الشاهد أو ربطه بملف محدث"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </button>
                      </div>

                    </div>
                  `;
          }).join('');
        })()}
            </div>

            <!-- قسم المجلدات الداعمة كأكورديون منسدل منظم -->
            ${ind.subFolders && ind.subFolders.length > 0 ? `
            <div class="mt-3.5">
              <button type="button" onclick="toggleIndicatorSubFolders('${ind.code}')"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-l from-amber-50 via-sky-50/30 to-white border border-amber-200/90 hover:border-amber-400 hover:shadow-card transition-all group/subfold text-right">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover/subfold:scale-105 transition-transform">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>
                  </span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="text-xs font-black text-slate-800">مجلدات الشواهد والملفات الداعمة للمؤشر (${ind.subFolders.length} مجلدات فرعية)</p>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">تصفح منظم داخل المنصة ▾</span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-0.5 truncate">انقر للاستعراض والتوسيع واختيار أي مجلد لفتح ما بداخله ومعاينته مباشرة داخل المنصة</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-xs font-bold text-amber-700 hidden sm:inline">استعراض المجلدات</span>
                  <svg id="subFoldersChevron-${ind.code}" class="w-5 h-5 text-amber-600 shrink-0 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </button>

              <!-- الحاوية المنسدلة التي تنزل عند النقر -->
              <div id="subFoldersPanel-${ind.code}" class="hidden mt-2.5 p-3 sm:p-4 rounded-2xl bg-amber-50/40 border border-amber-200/90 space-y-3">
                <div class="text-[11px] font-bold text-slate-600 flex items-center justify-between px-1">
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>اختر المجلد المطلوب لعرض ملفاته وشواهده ومعاينتها داخل المنصة:</span>
                  </span>
                  ${ind.folderUrl ? `<a href="${ind.folderUrl}" target="_blank" rel="noopener noreferrer" class="text-amber-700 hover:text-amber-900 flex items-center gap-1 text-[11px] font-bold hover:underline"><span>مجلد Drive الرئيسي ↗</span></a>` : ''}
                </div>

                <!-- شبكة المجلدات الفرعية الأربعة -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${ind.subFolders.map((fold, fIdx) => `
                    <div class="rounded-xl border border-amber-200 bg-white overflow-hidden shadow-2xs hover:border-amber-400 transition-all">
                      <!-- رأس المجلد: قابل للنقر لتوسيع الملفات بداخله -->
                      <button type="button" onclick="toggleSubFolderFiles('${ind.code}', ${fIdx})"
                        class="w-full p-3 flex items-center justify-between gap-2.5 text-right hover:bg-amber-50/60 transition-colors group/fheader">
                        <div class="flex items-center gap-2.5 min-w-0">
                          <span class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover/fheader:bg-amber-200 transition-colors">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>
                          </span>
                          <div class="min-w-0">
                            <p class="text-xs font-bold text-slate-800 truncate group-hover/fheader:text-amber-900">${escapeHtml(fold.title)}</p>
                            <p class="text-[10px] text-slate-400 mt-0.5">يتضمن (${fold.files ? fold.files.length : 0}) شواهد/ملفات • <span class="text-amber-700 font-bold">اضغط للاستعراض ▾</span></p>
                          </div>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <a href="${fold.folderUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"
                            class="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors" title="فتح هذا المجلد مباشرة على Google Drive ↗">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                          <svg id="folderChevron-${ind.code}-${fIdx}" class="w-4 h-4 text-amber-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </button>

                      <!-- قائمة الملفات داخل هذا المجلد تفتح داخل المنصة -->
                      <div id="folderFiles-${ind.code}-${fIdx}" class="hidden p-2.5 pt-1.5 border-t border-amber-100 bg-amber-50/20 space-y-2">
                        ${fold.files.map(file => {
          const fileDirectUrl = file.type === 'folder'
            ? (file.folderUrl || (file.driveId.startsWith('http') ? file.driveId : `https://drive.google.com/drive/folders/${file.driveId}`))
            : buildDriveExternalUrl(file.driveId);
          const isSubFold = file.type === 'folder';

          return `
                            <div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/90 hover:border-brand-400 hover:shadow-2xs transition-all">
                              <!-- زر النقر للمعاينة داخل المنصة -->
                              <button
                                data-ev="${escapeAttr(JSON.stringify({ title: file.title, fileName: file.fileName || file.title, code: ind.code, type: file.type, driveId: file.driveId, date: '1448هـ', issuer: 'المرحلة الابتدائية - بنين', track: ind.trackLabel }))}"
                                onclick="${isSubFold ? `window.open('${fileDirectUrl}', '_blank')` : 'openEvidenceModalFromData(this)'}"
                                class="flex items-center gap-2 min-w-0 text-right flex-grow"
                                title="${isSubFold ? 'فتح المجلد في Drive' : 'معاينة هذا الشاهد مباشرة داخل المنصة'}"
                              >
                                <span class="w-6 h-6 rounded-md ${getIconBg(file.type)} flex items-center justify-center shrink-0">
                                  ${getIcon(file.type)}
                                </span>
                                <span class="text-xs font-bold text-slate-800 truncate hover:text-brand-700 transition-colors">
                                  ${escapeHtml(file.title)}
                                </span>
                              </button>

                              <!-- أزرار الإجراءات السريعة للملف -->
                              <div class="flex items-center gap-1 shrink-0">
                                ${!isSubFold ? `
                                <button
                                  data-ev="${escapeAttr(JSON.stringify({ title: file.title, fileName: file.fileName || file.title, code: ind.code, type: file.type, driveId: file.driveId, date: '1448هـ', issuer: 'المرحلة الابتدائية - بنين', track: ind.trackLabel }))}"
                                  onclick="openEvidenceModalFromData(this)"
                                  class="px-2 py-1 rounded-md bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700 text-[10px] font-bold flex items-center gap-1 transition-all"
                                  title="معاينة الملف داخل المنصة"
                                >
                                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                  <span>معاينة بالمنصة</span>
                                </button>
                                ` : ''}

                                <a href="${fileDirectUrl}" target="_blank" rel="noopener noreferrer"
                                  class="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                  title="فتح في Google Drive ↗"
                                >
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                </a>
                              </div>
                            </div>
                          `;
        }).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            ` : (ind.folderUrl ? `
            <!-- شريط وصول سريع لمجلد المؤشر في Drive -->
            <div class="mt-3">
              <a href="${ind.folderUrl}" target="_blank" rel="noopener noreferrer"
                class="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-l from-amber-50/70 via-sky-50/40 to-white border border-amber-200/90 hover:border-amber-400 hover:shadow-card transition-all group/folder text-right">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 group-hover/folder:scale-105 transition-transform shadow-2xs">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>
                  </span>
                  <div class="min-w-0">
                    <p class="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>مجلد المؤشر الرئيسي في Google Drive</span>
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">تحديث حي ↗</span>
                    </p>
                    <p class="text-[10px] text-slate-500 truncate">تصفح ورفع وتنزيل كافة الملفات والمجلدات الفرعية مباشرة من Google Drive</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 text-amber-700 text-xs font-bold bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 group-hover/folder:bg-amber-50 transition-colors shadow-2xs">
                  <span>فتح المجلد في Drive</span>
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </div>
              </a>
            </div>
            ` : '')}
            </div>
          </div>
          `}
        </div>
      `;
    }
    // يحوّل سمة data-ev (JSON آمن ضد كسر الاقتباس) لاستدعاء نافذة المعاينة
    function openEvidenceModalFromData(btn) {
      try {
        const d = JSON.parse(btn.dataset.ev);
        openEvidenceModal(d.title, d.code, d.type, d.driveId, d.date, d.issuer, d.track);
      } catch (e) {
        console.error('تعذر قراءة بيانات الشاهد', e);
      }
    }

    function escapeAttr(string) {
      return String(string)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function getIcon(type) {
      if (type === 'folder') {
        return `<svg class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>`;
      } else if (type === 'pdf') {
        return `<svg class="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>`;
      } else if (type === 'sheet') {
        return `<svg class="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm5-4h-5V8h4a1 1 0 011 1v1zm-7-2v2H4V9a1 1 0 011-1h5z" clip-rule="evenodd"></path></svg>`;
      } else if (type === 'doc' || type === 'docx') {
        return `<svg class="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 5a1 1 0 000 2h6a1 1 0 100-2H7zm0 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg>`;
      } else if (type === 'image') {
        return `<svg class="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>`;
      }
      return `<svg class="w-3.5 h-3.5 text-brand-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path></svg>`;
    }

    function getIconBg(type) {
      if (type === 'folder') return 'bg-amber-50 text-amber-600 border border-amber-100';
      if (type === 'pdf') return 'bg-red-50 text-red-600 border border-red-100';
      if (type === 'sheet') return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      if (type === 'doc' || type === 'docx') return 'bg-blue-50 text-blue-600 border border-blue-100';
      if (type === 'image') return 'bg-purple-50 text-purple-600 border border-purple-100';
      return 'bg-sky-50 text-sky-600 border border-sky-100';
    }
    // ==========================================
    // دوال الفلترة والبحث العام
    // ==========================================
    function setTrackFilter(trackKey) {
      currentTrackFilter = trackKey;
      const btns = document.querySelectorAll('.track-btn');
      btns.forEach(btn => {
        if (btn.getAttribute('data-track') === trackKey) {
          btn.className = "track-btn active flex items-center justify-between px-3 py-2 rounded-xl font-bold transition-all bg-brand-600 text-white shadow-sm";
        } else {
          btn.className = "track-btn flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all font-medium";
        }
      });
      renderDashboard();
    }

    function handleGlobalSearch() {
      const input = document.getElementById('globalSearchInput');
      const clearBtn = document.getElementById('clearSearchBtn');
      currentSearchTerm = input.value;
      if (currentSearchTerm.trim().length > 0) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
      renderDashboard();
    }

    function clearGlobalSearch() {
      const input = document.getElementById('globalSearchInput');
      const clearBtn = document.getElementById('clearSearchBtn');
      input.value = '';
      currentSearchTerm = '';
      clearBtn.classList.add('hidden');
      renderDashboard();
      showToast('تمت إعادة ضبط التصفية والبحث');
    }

    // ==========================================
    // عارض الشواهد المدمج (In-App Drive Preview Modal)
    // ==========================================

// فتح/طي قائمة مجلدات الشواهد الداعمة التابعة للمؤشر
    function toggleIndicatorSubFolders(code) {
      const panel = document.getElementById('subFoldersPanel-' + code);
      const chevron = document.getElementById('subFoldersChevron-' + code);
      if (!panel) return;
      panel.classList.toggle('hidden');
      if (chevron) chevron.classList.toggle('rotate-180');
    }

    // فتح/طي قائمة الملفات داخل مجلد فرعي معين
    function toggleSubFolderFiles(code, fIdx) {
      const list = document.getElementById('folderFiles-' + code + '-' + fIdx);
      const chevron = document.getElementById('folderChevron-' + code + '-' + fIdx);
      if (!list) return;
      list.classList.toggle('hidden');
      if (chevron) chevron.classList.toggle('rotate-180');
    }

    function toggleMobileSidebar() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      const icon = document.getElementById('sidebarToggleIcon');
      sidebar.classList.toggle('translate-x-full');
      if (overlay) overlay.classList.toggle('hidden');
      if (icon) icon.classList.toggle('rotate-90');
    }

    function showToast(msg) {
      const toast = document.getElementById('toastNotification');
      const text = document.getElementById('toastMessage');
      if (!toast || !text) return;

      text.textContent = msg;
      toast.classList.remove('opacity-0', '-translate-y-20', 'pointer-events-none');
      toast.classList.add('opacity-100', 'translate-y-0');

      setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-20', 'pointer-events-none');
      }, 2500);
    }

    function escapeHtml(string) {
      return String(string)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // توليد مستند رسمي بهوية دار الفرسان عند النقر على الشواهد

// تهيئة المنصة عند اكتمال تحميل المستند
window.addEventListener('DOMContentLoaded', () => {
  calculateTotalEvidenceCount();
  if (typeof updateCustomLinksCountBadge === 'function') updateCustomLinksCountBadge();
  if (typeof buildSidebarStandardsLists === 'function') buildSidebarStandardsLists();
  renderDashboard();
  if (typeof initAccreditationCharts === 'function') {
    setTimeout(initAccreditationCharts, 120);
  }
});
