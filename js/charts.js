/**
 * ============================================================
 * نظام الرسوم البيانية والإحصائيات التفاعلية (Chart.js)
 * منصة الاعتماد والتميز المؤسسي - مدارس دار الفرسان
 * ============================================================
 */

let domainsBarChartInstance = null;
let typesDoughnutChartInstance = null;

function initAccreditationCharts() {
      // 1. حساب بيانات الشواهد الحقيقية من مصفوفة forsanAccreditationData
      const domainLabels = [];
      const domainEvidenceCounts = [];
      const domainIndicatorCounts = [];

      let pdfCount = 0;
      let docCount = 0;
      let sheetCount = 0;

      forsanAccreditationData.forEach(d => {
        domainLabels.push(d.title);
        let evCount = 0;
        let indCount = 0;
        d.standards.forEach(s => {
          indCount += s.indicators.length;
          s.indicators.forEach(i => {
            evCount += i.evidences.length;
            i.evidences.forEach(e => {
              if (e.type === 'pdf') pdfCount++;
              else if (e.type === 'doc' || e.type === 'docx') docCount++;
              else if (e.type === 'sheet') sheetCount++;
              else pdfCount++;
            });
          });
        });
        domainEvidenceCounts.push(evCount);
        domainIndicatorCounts.push(indCount);
      });

      // 2. إنشاء رسم بياني للأعمدة (توزيع الشواهد على المجالات)
      const barCanvas = document.getElementById('domainsBarChart');
      if (barCanvas && window.Chart) {
        if (domainsBarChartInstance) domainsBarChartInstance.destroy();
        domainsBarChartInstance = new Chart(barCanvas, {
          type: 'bar',
          data: {
            labels: domainLabels,
            datasets: [
              {
                label: 'شواهد Google Drive الموثقة',
                data: domainEvidenceCounts,
                backgroundColor: [
                  'rgba(2, 132, 199, 0.85)',
                  'rgba(16, 185, 129, 0.85)',
                  'rgba(99, 102, 241, 0.85)',
                  'rgba(245, 158, 11, 0.85)'
                ],
                borderColor: [
                  '#0284c7',
                  '#10b981',
                  '#6366f1',
                  '#f59e0b'
                ],
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.6
              },
              {
                label: 'عدد المؤشرات',
                data: domainIndicatorCounts,
                backgroundColor: 'rgba(148, 163, 184, 0.45)',
                borderColor: '#94a3b8',
                borderWidth: 1.5,
                borderRadius: 8,
                barPercentage: 0.6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                rtl: true,
                labels: { font: { family: 'Tajawal', size: 12, weight: 'bold' } }
              },
              tooltip: {
                rtl: true,
                titleFont: { family: 'Cairo', size: 13 },
                bodyFont: { family: 'Tajawal', size: 12 }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(226, 232, 240, 0.6)' },
                ticks: { font: { family: 'Tajawal', size: 11 } }
              },
              x: {
                grid: { display: false },
                ticks: { font: { family: 'Cairo', size: 11, weight: 'bold' } }
              }
            }
          }
        });
      }

      // 3. إنشاء رسم بياني دائري (توزيع نوعية الملفات)
      const doughnutCanvas = document.getElementById('typesDoughnutChart');
      if (doughnutCanvas && window.Chart) {
        if (typesDoughnutChartInstance) typesDoughnutChartInstance.destroy();
        typesDoughnutChartInstance = new Chart(doughnutCanvas, {
          type: 'doughnut',
          data: {
            labels: ['تقارير PDF معتمدة', 'ملفات Word توثيق', 'جداول Excel وخطط'],
            datasets: [{
              data: [pdfCount, docCount, sheetCount],
              backgroundColor: ['#ef4444', '#3b82f6', '#10b981'],
              borderColor: '#ffffff',
              borderWidth: 3,
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: {
                position: 'bottom',
                rtl: true,
                labels: { font: { family: 'Tajawal', size: 12, weight: 'bold' } }
              },
              tooltip: {
                rtl: true,
                callbacks: {
                  label: function (ctx) {
                    const total = pdfCount + docCount + sheetCount;
                    const val = ctx.raw;
                    const pct = Math.round((val / total) * 100);
                    return ' ' + ctx.label + ': ' + val + ' ملف (' + pct + '%)';
                  }
                }
              }
            }
          }
        });
      }
    }

    function switchChartTab(tab) {
      const btn1 = document.getElementById('chartTabBtn1');
      const btn2 = document.getElementById('chartTabBtn2');
      const wrap1 = document.getElementById('domainsChartWrapper');
      const wrap2 = document.getElementById('typesChartWrapper');

      if (tab === 'domains') {
        btn1.className = "px-3 py-1.5 rounded-lg font-bold bg-white text-brand-navy shadow-xs transition-all";
        btn2.className = "px-3 py-1.5 rounded-lg font-medium text-slate-300 hover:text-white transition-all";
        wrap1.classList.remove('hidden');
        wrap2.classList.add('hidden');
      } else {
        btn2.className = "px-3 py-1.5 rounded-lg font-bold bg-white text-brand-navy shadow-xs transition-all";
        btn1.className = "px-3 py-1.5 rounded-lg font-medium text-slate-300 hover:text-white transition-all";
        wrap2.classList.remove('hidden');
        wrap1.classList.add('hidden');
      }
    }

    function toggleChartsPanel() {
      const panel = document.getElementById('chartsContainerPanel');
      const icon = document.getElementById('chartsToggleIcon');
      if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        icon.classList.remove('rotate-180');
      } else {
        panel.classList.add('hidden');
        icon.classList.add('rotate-180');
      }
    }