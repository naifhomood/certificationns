let certificatesData = [];
let currentCertificateIndex = 0;
let filteredCertificates = [];

async function fetchGoogleSheet() {
    const spreadsheetId = "1Pz2qNz0qfrYa5oI3eNCqPkiKTjtpVNvFWDV8F5y1trA";
    const sheetName = "Sheet1";
    const apiKey = "AIzaSyCrWNd7PF8Cy5TIq7QAltyt4VV4p9_7kLE";

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values || data.values.length < 2) {
            document.getElementById("dataContainer").innerHTML = `<div class="error-message">لا توجد بيانات متاحة</div>`;
            updateCertificatesCount(0);
            return;
        }

        // تحويل البيانات إلى مصفوفة من الكائنات
        const headers = data.values[0];
        certificatesData = data.values.slice(1)
            .map(row => {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = row[index] || '';
                });
                return rowData;
            })
            // فلترة السجلات التي تحتوي على روابط صور فقط
            .filter(cert => cert['certificate url'] && cert['certificate url'].trim() !== '');

        // تحديث قوائم الفلترة
        updateFilters();

        displayCertificates(certificatesData);
        updateCertificatesCount(certificatesData.length);
    } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        document.getElementById("dataContainer").innerHTML = `<div class="error-message">حدث خطأ أثناء تحميل البيانات</div>`;
        updateCertificatesCount(0);
    }
}

function getFilteredData(excludeEmployee = false, excludeYear = false) {
    const department = document.getElementById("departmentFilter").value;
    const year = excludeYear ? '' : document.getElementById("yearFilter").value;
    const employee = excludeEmployee ? '' : document.getElementById("employeeFilter").value;
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();

    return certificatesData.filter(cert => {
        // فلتر الإدارة
        const departmentMatch = !department || cert['Column1.department'] === department;

        // فلتر السنة
        const certDate = cert['Column1.employee_courses_degree.certificate_date'];
        const certYear = certDate ? new Date(certDate).getFullYear().toString() : '';
        const yearMatch = !year || certYear === year;

        // فلتر الموظف
        const employeeMatch = !employee || cert['Column1.employee_name'] === employee;

        // فلتر البحث
        const searchMatch = !searchTerm || 
            cert['Column1.employee_name']?.toLowerCase().includes(searchTerm) ||
            cert['Column1.employee_courses_degree.certificate_name']?.toLowerCase().includes(searchTerm);

        return departmentMatch && yearMatch && employeeMatch && searchMatch;
    });
}

function updateFilters(triggeredBy = '') {
    const department = document.getElementById("departmentFilter").value;
    const year = document.getElementById("yearFilter").value;
    const employee = document.getElementById("employeeFilter").value;
    
    // تحديث قائمة الإدارات
    const departments = [...new Set(certificatesData
        .filter(cert => {
            if (employee) return cert['Column1.employee_name'] === employee;
            return true;
        })
        .map(cert => cert['Column1.department'])
        .filter(Boolean)
    )].sort();
    
    const departmentFilter = document.getElementById('departmentFilter');
    const currentDepartment = departmentFilter.value;
    
    if (triggeredBy !== 'department') {
        departmentFilter.innerHTML = '<option value="">كل الإدارات</option>' +
            departments.map(dept => `<option value="${dept}" ${dept === currentDepartment && departments.includes(currentDepartment) ? 'selected' : ''}>${dept}</option>`).join('');
        
        if (currentDepartment && !departments.includes(currentDepartment)) {
            departmentFilter.value = '';
        }
    }
    
    // تحديث قائمة السنوات بناءً على الإدارة والموظف المحدد
    const yearsData = certificatesData
        .filter(cert => {
            const deptMatch = !department || cert['Column1.department'] === department;
            const empMatch = !employee || cert['Column1.employee_name'] === employee;
            return deptMatch && empMatch;
        })
        .map(cert => {
            const date = cert['Column1.employee_courses_degree.certificate_date'];
            return date ? new Date(date).getFullYear() : null;
        })
        .filter(Boolean);
    
    const years = [...new Set(yearsData)].sort((a, b) => b - a);
    const yearFilter = document.getElementById('yearFilter');
    const currentYear = yearFilter.value;
    
    if (triggeredBy !== 'year') {
        yearFilter.innerHTML = '<option value="">كل السنوات</option>' +
            years.map(year => `<option value="${year}" ${year.toString() === currentYear && years.includes(Number(currentYear)) ? 'selected' : ''}>${year}</option>`).join('');
        
        if (currentYear && !years.includes(Number(currentYear))) {
            yearFilter.value = '';
        }
    }

    // تحديث قائمة الموظفين بناءً على الإدارة والسنة المحددة
    const employeesData = certificatesData
        .filter(cert => {
            const deptMatch = !department || cert['Column1.department'] === department;
            const certYear = cert['Column1.employee_courses_degree.certificate_date'] ? 
                new Date(cert['Column1.employee_courses_degree.certificate_date']).getFullYear().toString() : '';
            const yearMatch = !year || certYear === year;
            return deptMatch && yearMatch;
        })
        .map(cert => cert['Column1.employee_name'])
        .filter(Boolean);

    const employees = [...new Set(employeesData)].sort();
    const employeeFilter = document.getElementById('employeeFilter');
    const currentEmployee = employeeFilter.value;
    
    if (triggeredBy !== 'employee') {
        employeeFilter.innerHTML = '<option value="">كل الموظفين</option>' +
            employees.map(emp => `<option value="${emp}" ${emp === currentEmployee && employees.includes(currentEmployee) ? 'selected' : ''}>${emp}</option>`).join('');

        if (currentEmployee && !employees.includes(currentEmployee)) {
            employeeFilter.value = '';
        }
    }

    // تحديث عرض البطاقات
    filterCertificates();
}

function filterCertificates() {
    const department = document.getElementById("departmentFilter").value;
    const year = document.getElementById("yearFilter").value;
    const employee = document.getElementById("employeeFilter").value;
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();

    const filteredData = certificatesData.filter(cert => {
        // فلتر الإدارة
        const departmentMatch = !department || cert['Column1.department'] === department;

        // فلتر السنة
        const certDate = cert['Column1.employee_courses_degree.certificate_date'];
        const certYear = certDate ? new Date(certDate).getFullYear().toString() : '';
        const yearMatch = !year || certYear === year;

        // فلتر الموظف
        const employeeMatch = !employee || cert['Column1.employee_name'] === employee;

        // فلتر البحث
        const searchMatch = !searchTerm || 
            cert['Column1.employee_name']?.toLowerCase().includes(searchTerm) ||
            cert['Column1.employee_courses_degree.certificate_name']?.toLowerCase().includes(searchTerm);

        return departmentMatch && yearMatch && employeeMatch && searchMatch;
    });

    displayCertificates(filteredData);
    updateCertificatesCount(filteredData.length);
}

function updateCertificatesCount(count) {
    document.getElementById("certificatesCount").textContent = count;
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    } catch (e) {
        return dateString;
    }
}

function getGenderIcon(gender) {
    return gender?.toLowerCase() === 'female' ? 'fa-female' : 'fa-male';
}

function handleImageError(img) {
    console.log('فشل تحميل الصورة:', img.src);
    img.style.display = 'none';
    img.parentElement.innerHTML = `
        <div class="certificate-placeholder">
            <i class="fas fa-certificate"></i>
            <p>الصورة غير متوفرة</p>
        </div>
    `;
}

function displayCertificates(certificates) {
    const container = document.getElementById("dataContainer");
    filteredCertificates = certificates;
    
    if (!certificates || certificates.length === 0) {
        container.innerHTML = `<div class="error-message">لا توجد شهادات متاحة</div>`;
        return;
    }

    container.innerHTML = certificates.map((cert, index) => {
        const certificateUrl = cert['certificate url'] || '';
        
        return `
            <div class="certificate-card" onclick="showCertificateModal(${index})">
                <div class="certificate-image-container">
                    <img src="${certificateUrl}" 
                         alt="${cert['Column1.employee_courses_degree.certificate_name'] || 'شهادة مهنية'}" 
                         class="certificate-image"
                         onerror="handleImageError(this)">
                </div>
                <div class="certificate-header">
                    <h2>${cert['Column1.employee_courses_degree.certificate_name'] || 'شهادة'}</h2>
                </div>
                <div class="certificate-content">
                    <div class="certificate-info">
                        <i class="fas ${getGenderIcon(cert['Column1.gender'])}"></i>
                        <span>اسم الموظف: ${cert['Column1.employee_name'] || 'غير محدد'}</span>
                    </div>
                    <div class="certificate-info">
                        <i class="fas fa-building"></i>
                        <span>الإدارة: ${cert['Column1.department'] || 'غير محدد'}</span>
                    </div>
                    <div class="certificate-info">
                        <i class="fas fa-envelope"></i>
                        <span>البريد الإلكتروني: ${cert['Column1.user_id'] || 'غير محدد'}</span>
                    </div>
                    <div class="certificate-info">
                        <i class="fas fa-calendar-check"></i>
                        <span>تاريخ الشهادة: ${formatDate(cert['Column1.employee_courses_degree.certificate_date'])}</span>
                    </div>
                    <div class="certificate-info">
                        <i class="fas fa-user-clock"></i>
                        <span>تاريخ الانضمام: ${formatDate(cert['Column1.date_of_joining'])}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showFireworks() {
    const fireworksContainer = document.querySelector('.firework-container');
    if (!fireworksContainer) return;

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    
    for (let i = 0; i < 3; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: x/100, y: y/100 },
            colors: [color],
            zIndex: 1200
        });
    }
}

function showCertificateModal(index) {
    currentCertificateIndex = index;
    const certificate = filteredCertificates[index];
    const modal = document.getElementById('modal');

    // إضافة أزرار التنقل وزر الإغلاق
    const modalHTML = `
        <div class="modal-content">
            <button class="close-button" onclick="closeModal()">×</button>
            <div class="certificate-content">
                <div class="certificate-image-container">
                    <img src="${certificate['certificate url']}" alt="Certificate" onerror="this.src='placeholder.jpg'">
                </div>
                <div class="certificate-details">
                    <h2>${certificate['Column1.employee_courses_degree.certificate_name'] || 'شهادة'}</h2>
                    <div class="certificate-info">
                        <div class="info-row">
                            <i class="fas fa-user"></i>
                            <div class="info-label">اسم الموظف</div>
                            <div class="info-value">${certificate['Column1.employee_name'] || '-'}</div>
                        </div>
                        
                        <div class="info-row">
                            <i class="fas fa-building"></i>
                            <div class="info-label">الإدارة</div>
                            <div class="info-value">${certificate['Column1.department'] || '-'}</div>
                        </div>
                        
                        <div class="info-row">
                            <i class="fas fa-calendar-alt"></i>
                            <div class="info-label">البريد الإلكترون</div>
                            <div class="info-value">${formatDate(certificate['Column1.user_id']) || '-'}</div>
                        </div>
                        
                        <div class="info-row">
                            <i class="fas fa-calendar-times"></i>
                            <div class="info-label">تاريخ الشهادة</div>
                            <div class="info-value">${formatDate(certificate['Column1.employee_courses_degree.certificate_date']) || '-'}</div>
                        </div>
                        
                        <div class="info-row">
                            <i class="fas fa-university"></i>
                            <div class="info-label">تاريخ الانضمام</div>
                            <div class="info-value">${certificate['Column1.date_of_joining'] || '-'}</div>
                        </div>

                    </div>
                </div>
            </div>
            <div class="navigation-buttons">
                <button class="nav-button" onclick="showPreviousCertificate()" title="السابق">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="nav-button" onclick="showNextCertificate()" title="التالي">
                    <i class="fas fa-chevron-left"></i>
                </button>
            </div>
        </div>
    `;

    modal.innerHTML = modalHTML;
    modal.classList.add('show');

    // التأكد من تحميل الصورة
    const img = modal.querySelector('img');
    if (img) {
        img.onload = function() {
            if (img.naturalHeight === 0) {
                img.src = 'placeholder.jpg';
            }
            showFireworks();
        };
        img.onerror = function() {
            img.src = 'placeholder.jpg';
            showFireworks();
        };
    } else {
        showFireworks();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
}

// إضافة مستمع للنقر خارج المودال
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

function showNextCertificate() {
    if (currentCertificateIndex < filteredCertificates.length - 1) {
        currentCertificateIndex++;
        showCertificateModal(currentCertificateIndex);
    }
}

function showPreviousCertificate() {
    if (currentCertificateIndex > 0) {
        currentCertificateIndex--;
        showCertificateModal(currentCertificateIndex);
    }
}

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', fetchGoogleSheet);
