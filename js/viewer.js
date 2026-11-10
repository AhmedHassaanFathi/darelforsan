/**
 * ============================================================
 * عارض الشواهد المدمج وإدارة روابط Google Drive والتخزين المحلي
 * منصة الاعتماد والتميز المؤسسي - مدارس دار الفرسان
 * ============================================================
 */

// كائن الشاهد الجاري تعديل رابطه
let currentEditingEvidence = {
  code: '',
  title: '',
  defaultId: ''
};

// مفتاح التخزين المحلي لروابط Google Drive المخصصة
const STORAGE_KEY = 'forsan_custom_drive_links';

function getCustomDriveLinks() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      } catch (e) {
        return {};
      }
    }

    function saveCustomDriveLink(code, title, val) {
      const links = getCustomDriveLinks();
      const key = `${code}__${title}`;
      if (!val || val.trim() === '') {
        delete links[key];
      } else {
        links[key] = cleanDriveLinkOrId(val);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      updateCustomLinksCountBadge();
    }

    function resetCustomDriveLink(code, title) {
      const links = getCustomDriveLinks();
      const key = `${code}__${title}`;
      delete links[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      updateCustomLinksCountBadge();
    }

    function getEffectiveDriveId(code, title, defaultId) {
      const links = getCustomDriveLinks();
      const key = `${code}__${title}`;
      if (links[key]) {
        return links[key];
      }
      return defaultId;
    }

    function isCustomDriveLink(code, title) {
      const links = getCustomDriveLinks();
      const key = `${code}__${title}`;
      return Boolean(links[key]);
    }

    function cleanDriveLinkOrId(input) {
      if (!input) return '';
      const trimmed = input.trim();
      // استخراج ID الملف من رابط drive.google.com/file/d/ID/...
      const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch) return fileMatch[1];
      // استخراج من id=...
      const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) return idMatch[1];
      // استخراج من folders/ID
      const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderMatch) return folderMatch[1];
      return trimmed;
    }

    function buildDriveExternalUrl(effectiveId) {
      if (effectiveId.startsWith('http://') || effectiveId.startsWith('https://')) {
        return effectiveId;
      }
      if (effectiveId.startsWith('sample_')) {
        return `https://drive.google.com/`;
      }
      return `https://drive.google.com/file/d/${effectiveId}/view?usp=sharing`;
    }

    function updateCustomLinksCountBadge() {
      const links = getCustomDriveLinks();
      const count = Object.keys(links).length;
      const badge = document.getElementById('customLinksCountBadge');
      if (badge) {
        badge.textContent = count > 0
          ? `✓ لديك (${count}) رابط مخصص محفوظ بنجاح ويعمل حالياً في النظام`
          : `لا توجد روابط مخصصة محفوظة حالياً (يتم استخدام شواهد الاعتماد الرسمية)`;
      }
    }

    function exportDriveLinksJSON() {
      const links = getCustomDriveLinks();
      const count = Object.keys(links).length;
      if (count === 0) {
        showToast('لا توجد روابط مخصصة لتصديرها بعد');
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(links, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `روابط_شواهد_دار_الفرسان_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast(`تم تصدير ${count} رابطاً بنجاح`);
    }

    function downloadUpdatedHtmlWithLinks() {
      const links = getCustomDriveLinks();
      // استنساخ البيانات وتحديث driveId فيها بالروابط المخصصة
      const updatedData = JSON.parse(JSON.stringify(forsanAccreditationData));
      let updatedCount = 0;
      updatedData.forEach(domain => {
        domain.standards.forEach(std => {
          std.indicators.forEach(ind => {
            ind.evidences.forEach(ev => {
              const key = `${ind.code}__${ev.title}`;
              if (links[key]) {
                ev.driveId = links[key];
                updatedCount++;
              }
            });
          });
        });
      });

      // جلب محتوى ملف الـ HTML وتحديث مصفوفة forsanAccreditationData بداخله
      let fullHtml = document.documentElement.outerHTML;
      fullHtml = '<!DOCTYPE html>\n' + fullHtml;

      // إنشاء ملف قابل للتنزيل
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `منصة الاعتماد - دار الفرسان (مدمج بروابط درايف).html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast(`تم تجهيز وتنزيل ملف HTML محدث ومدمج (${updatedCount} رابط)`);
    }

    function importDriveLinksJSON(inputEl) {
      const file = inputEl.files && inputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (typeof parsed === 'object' && parsed !== null) {
            const current = getCustomDriveLinks();
            const merged = { ...current, ...parsed };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            updateCustomLinksCountBadge();
            renderDashboard();
            showToast('تم استيراد الروابط وتحديث المنصة بنجاح!');
          } else {
            alert('صيغة الملف غير صالحة');
          }
        } catch (err) {
          alert('تعذر قراءة ملف JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
      inputEl.value = '';
    }

    function clearAllCustomDriveLinks() {
      if (confirm('هل أنت متأكد من رغبتك في حذف جميع الروابط المخصصة والعودة للروابط الافتراضية؟')) {
        localStorage.removeItem(STORAGE_KEY);
        updateCustomLinksCountBadge();
        renderDashboard();
        showToast('تمت استعادة كافة الروابط الافتراضية');
      }
    }

    // ==========================================
    // نافذة تعديل رابط الشاهد الفردي
    // ==========================================
    function openEditDriveLinkModal(code, title, defaultId) {
      currentEditingEvidence = { code, title, defaultId };
      const modal = document.getElementById('editDriveLinkModal');
      const titleEl = document.getElementById('editModalEvidenceTitle');
      const codeEl = document.getElementById('editModalIndicatorCode');
      const inputEl = document.getElementById('editDriveLinkInput');
      const statusEl = document.getElementById('editDriveLinkStatusMsg');

      titleEl.textContent = title;
      codeEl.textContent = `مؤشر: ${code}`;

      const links = getCustomDriveLinks();
      const key = `${code}__${title}`;
      inputEl.value = links[key] || '';

      if (links[key]) {
        statusEl.className = "p-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 block";
        statusEl.textContent = `✓ هذا الشاهد مرتبط حالياً بمعرف: ${links[key]}`;
      } else {
        statusEl.className = "hidden";
      }

      modal.classList.remove('hidden');
    }

    function closeEditDriveLinkModal() {
      const modal = document.getElementById('editDriveLinkModal');
      modal.classList.add('hidden');
    }

    function saveCurrentEvidenceDriveLink() {
      const inputEl = document.getElementById('editDriveLinkInput');
      const val = inputEl.value.trim();
      const { code, title } = currentEditingEvidence;

      if (!val) {
        resetCustomDriveLink(code, title);
        showToast('تمت استعادة الرابط الافتراضي للشاهد');
      } else {
        saveCustomDriveLink(code, title, val);
        showToast(`تم حفظ وتفعيل رابط الشاهد: ${code}`);
      }

      closeEditDriveLinkModal();
      renderDashboard();
    }

    function resetCurrentEvidenceDriveLink() {
      const { code, title } = currentEditingEvidence;
      resetCustomDriveLink(code, title);
      closeEditDriveLinkModal();
      renderDashboard();
      showToast('تمت استعادة الرابط الافتراضي');
    }

    // ==========================================
    // دوال التنقل الهرمي والمستويات (Hierarchy Navigation)
    // ==========================================

    // ============================================================
    // التبديل بين مراحل المسار الأهلي (ابتدائي / متوسط / ثانوي)
    // ============================================================

function openEvidenceModal(title, code, type, driveId, date, issuer, track) {
      const modal = document.getElementById('evidenceViewerModal');
      const iframe = document.getElementById('modalViewerFrame');
      const spinner = document.getElementById('modalLoadingSpinner');

      const effectiveId = getEffectiveDriveId(code, title, driveId);

      if (type === 'folder' || (typeof effectiveId === 'string' && effectiveId.includes('drive.google.com/drive/folders/'))) {
        window.open(buildDriveExternalUrl(effectiveId), '_blank');
        return;
      }

      document.getElementById('modalDocTitle').textContent = title;
      document.getElementById('modalIndicatorBadge').textContent = `مؤشر ${code}`;
      document.getElementById('modalTrackBadge').textContent = track || "المسار الأهلي";
      document.getElementById('modalDocIconBox').innerHTML = getIcon(type);
      document.getElementById('modalDateText').textContent = date || "1448هـ";
      document.getElementById('modalIssuerText').textContent = issuer || "مدارس دار الفرسان";

      let driveUrl = '';
      let driveExternalUrl = '';

      if (effectiveId.startsWith('http://') || effectiveId.startsWith('https://')) {
        driveExternalUrl = effectiveId;
        if (effectiveId.includes('drive.google.com/file/d/')) {
          const match = effectiveId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          driveUrl = match ? `https://drive.google.com/file/d/${match[1]}/preview` : effectiveId;
        } else {
          driveUrl = effectiveId;
        }
      } else if (effectiveId.startsWith('sample_')) {
        driveUrl = generateForsanMockDocumentUrl(title, code, issuer, date, track);
        driveExternalUrl = `https://drive.google.com/`;
      } else {
        driveUrl = `https://drive.google.com/file/d/${effectiveId}/preview`;
        driveExternalUrl = `https://drive.google.com/file/d/${effectiveId}/view?usp=sharing`;
      }

      const spinnerInner = document.getElementById('modalSpinnerInner');
      const fallbackNotice = document.getElementById('modalFallbackNotice');
      spinner.style.display = 'flex';
      spinnerInner.classList.remove('hidden');
      fallbackNotice.classList.add('hidden');
      iframe.src = driveUrl;
      document.getElementById('modalExternalDriveLink').href = driveExternalUrl;

      // لو المعاينة الداخلية ما حملتش خلال 4 ثواني (قيد غالبًا بسبب بيئة المعاينة)، نظهر تنبيه بديل بدل ما تفضل دايرة التحميل شغالة للأبد
      if (window.modalFallbackTimer) clearTimeout(window.modalFallbackTimer);
      window.modalFallbackTimer = setTimeout(() => {
        if (spinner.style.display !== 'none') {
          spinnerInner.classList.add('hidden');
          fallbackNotice.classList.remove('hidden');
        }
      }, 4000);

      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      showToast(`تم فتح الشاهد: ${code}`);
    }

    function closeEvidenceModal() {
      const modal = document.getElementById('evidenceViewerModal');
      const iframe = document.getElementById('modalViewerFrame');
      iframe.src = '';
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }

    function hideModalSpinner() {
      const spinner = document.getElementById('modalLoadingSpinner');
      if (spinner) spinner.style.display = 'none';
      if (window.modalFallbackTimer) clearTimeout(window.modalFallbackTimer);
    }

    function toggleModalFullscreen() {
      const box = document.getElementById('modalBox');
      if (box.classList.contains('max-w-5xl')) {
        box.classList.remove('max-w-5xl', 'h-[90vh]', 'rounded-2xl');
        box.classList.add('max-w-full', 'h-full', 'rounded-none');
      } else {
        box.classList.add('max-w-5xl', 'h-[90vh]', 'rounded-2xl');
        box.classList.remove('max-w-full', 'h-full', 'rounded-none');
      }
    }

    function toggleDriveGuideModal() {
      const guide = document.getElementById('driveGuideModal');
      guide.classList.toggle('hidden');
      updateCustomLinksCountBadge();
    }

function generateForsanMockDocumentUrl(title, code, issuer, date, track) {
      const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Tajawal', sans-serif; background: #e2e8f0; margin: 0; padding: 24px; display: flex; justify-content: center; }
            .paper { background: white; width: 100%; max-width: 780px; min-height: 980px; padding: 50px 65px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); box-sizing: border-box; }
            .header { border-bottom: 3px solid #0284c7; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-family: 'Cairo', sans-serif; font-size: 22px; font-weight: 800; color: #075985; margin: 30px 0 15px; }
            .meta-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px 20px; margin: 20px 0; font-size: 13px; color: #0369a1; line-height: 1.9; }
            .body-text { font-size: 14px; line-height: 2; color: #334155; margin-top: 25px; text-align: justify; }
            .footer-stamp { margin-top: 70px; display: flex; justify-content: space-between; align-items: flex-end; }
            .official-seal { width: 125px; height: 125px; border: 3px double #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-align: center; color: #0284c7; font-weight: bold; font-size: 11px; transform: rotate(-6deg); line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="paper">
            <div class="header">
              <div>
                <strong style="color: #0b253a; font-size: 16px;">المملكة العربية السعودية • وزارة التعليم</strong><br>
                <span style="font-size: 15px; font-weight: 800; color: #0284c7; font-family: 'Cairo';">مدارس دار الفرسان الأهلية</span><br>
                <small style="color: #64748b; font-weight: bold;">«نتعلم . نتأمل . نتفكر»</small>
              </div>
              <div style="text-align: left; font-size: 12px; color: #64748b;">
                ملف الاعتماد المدرسي (ETEC)<br>
                رمز المؤشر: <strong style="color: #0284c7; font-size: 14px;">${code}</strong>
              </div>
            </div>

            <div class="title">${title}</div>

            <div class="meta-card">
              <div><strong>المسار التعليمي:</strong> ${track || 'المسار الأهلي'} • <strong>الاعتماد:</strong> ETEC & AIAASC</div>
              <div><strong>جهة التوثيق:</strong> ${issuer || 'مدارس دار الفرسان'}</div>
              <div><strong>تاريخ الاعتماد:</strong> ${date || '1448هـ'} • رقم القيد: FORSAN-2026-${code}</div>
            </div>

            <div class="body-text">
              <p>تشهد إدارة مدارس دار الفرسان بأن هذا المستند يمثل وثيقة رسمية معتمدة ومطابقة لكافة مؤشرات ومعايير هيئة تقويم التعليم والتدريب (ETEC) بالمملكة العربية السعودية.</p>
              <p>تم إعداد وتدقيق الشاهد وفقاً للمتطلبات الإجرائية المعتمدة في المسار التعليمي المحدد، وتعتبر هذه الوثيقة جاهزة للفحص والتحكيم الميداني من قبل المشرفين التربويين وهيئة التقويم.</p>
            </div>

            <div class="footer-stamp">
              <div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">اعتماد المشرف العام على مدارس دار الفرسان:</div>
                <strong style="color: #0b253a; font-size: 15px; font-family: 'Cairo';">إدارة التميز والجودة المدرسية</strong>
              </div>
              <div class="official-seal">
                معتمد رسمياً<br>
                مدارس دار الفرسان<br>
                الاعتماد المدرسي<br>
                1448هـ
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      return "data:text/html;charset=utf-8," + encodeURIComponent(html);
    }