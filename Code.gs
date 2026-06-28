function fetchDataFromAPI() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var url = "https://next.rajhifoundation.org/api/method/arajhi.api.get_employee";
    var token = "7aaeb2a08627e99:bf2900a94be4b76"; // تأكد من صحة التوكن

    try {
        var options = {
            "method": "get",
            "muteHttpExceptions": true,
            "headers": {
                "Authorization": "token " + token,
                "Content-Type": "application/json"
            }
        };

        var response = UrlFetchApp.fetch(url, options);
        var responseCode = response.getResponseCode();
        var responseText = response.getContentText();

        if (responseCode !== 200) {
            Logger.log("❌ خطأ أثناء جلب البيانات: HTTP " + responseCode);
            Logger.log("🔹 استجابة الخادم: " + responseText);
            return;
        }

        var jsonData = JSON.parse(responseText);
        var employees = jsonData.message;

        // 🔹 **فلترة الموظفين الذين لديهم شهادات فقط**
        var filteredEmployees = employees.filter(emp => emp.employee_courses_degree && emp.employee_courses_degree.length > 0);

        if (filteredEmployees.length === 0) {
            Logger.log("⚠️ لا يوجد أي موظف لديه شهادة مهنية!");
            return;
        }

        // **مسح البيانات القديمة**
        sheet.clear();

        // **إنشاء رؤوس الأعمدة بنفس أسماء الأعمدة المطلوبة في التطبيق**
        var headers = [
            "Column1.employee_name", 
            "Column1.branch", 
            "Column1.department", 
            "Column1.gender", 
            "Column1.date_of_joining", 
            "Column1.user_id", 
            "Column1.designation", 
            "Column1.employee_courses_degree.certificate_name", 
            "Column1.employee_courses_degree.certificate_date", 
            "Column1.employee_courses_degree.attach_the_certificate", 
            "urlnext", 
            "certificate url"
        ];
        sheet.appendRow(headers);

        // **إدخال البيانات المفلترة إلى الجدول**
        filteredEmployees.forEach(emp => {
            emp.employee_courses_degree.forEach(cert => {
                var row = [
                    emp.employee_name,
                    emp.branch || "غير متوفر",
                    emp.department || "غير متوفر",
                    emp.gender,
                    emp.date_of_joining,
                    emp.user_id || "غير متوفر",
                    emp.designation || "غير متوفر",
                    cert.certificate_name || "غير متوفر",
                    cert.certificate_date || "غير متوفر",
                    cert.attach_the_certificate || "غير متوفر",
                    "https://next.rajhifoundation.org", // **القيمة الثابتة لعمود urlnext**
                    "https://next.rajhifoundation.org" + cert.attach_the_certificate // **إنشاء رابط الشهادة الصحيح**
                ];
                sheet.appendRow(row);
            });
        });

        Logger.log("✅ تم تحديث البيانات بنجاح!");
    } catch (error) {
        Logger.log("❌ خطأ أثناء جلب البيانات: " + error);
    }
}

/**
 * دالة doGet لتقديم البيانات من الشيت كـ JSON مع دعم CORS
 */
function doGet(e) {
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var data = sheet.getDataRange().getValues();

        var response = {
            success: true,
            values: data,
            timestamp: new Date().toISOString()
        };

        // إرسال الاستجابة بصيغة JSON
        return ContentService
            .createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                error: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
