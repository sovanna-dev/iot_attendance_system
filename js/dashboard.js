/*
 * ==========================================================
 *  DASHBOARD - FINAL VERSION
 *  Group 3 - AUB - IoT 431
 *  Features: Real-Time + Admin Panel + Quick Links
 * ==========================================================
 */

// ==========================================================
// GLOBAL VARIABLES
// ==========================================================
const TOTAL_STUDENTS = 10;

// Google Sheet URL - CHANGE THIS!
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1ffd-Y5zkmDJm1IzwUAscBcoTOP3UXC5zNeaZT7sDuM8/edit";

// Firebase Console URL
const FIREBASE_CONSOLE_URL = "https://console.firebase.google.com/project/attendance-system-esp32-c6ed2/database";

// ==========================================================
// LOAD ATTENDANCE (REAL-TIME FROM RTDB)
// ==========================================================
function loadAttendance() {
    const attendanceRef = database.ref('attendance');
    
    attendanceRef.on('value', (snapshot) => {
        const data = snapshot.val();
        updateTable(data);
    }, (error) => {
        console.error('❌ Firebase error:', error);
        document.getElementById('tableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;color:#f87171;">
                    ❌ Connection error: ${error.message}
                </td>
            </tr>
        `;
    });
}

// ==========================================================
// UPDATE TABLE
// ==========================================================
function updateTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    if (!data || Object.keys(data).length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;">
                    <div style="font-size:48px;margin-bottom:10px;">📭</div>
                    <div style="color:#94a3b8;">No attendance records yet</div>
                    <div style="color:#64748b;font-size:13px;margin-top:5px;">
                        Scan an RFID card to create the first record
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('todayCount').textContent = '0';
        document.getElementById('totalRecords').textContent = '0';
        document.getElementById('totalStudents').textContent = TOTAL_STUDENTS;
        document.getElementById('lastUpdate').textContent = '🟢 Connected - No data';
        return;
    }
    
    let records = [];
    const today = new Date().toISOString().split('T')[0];
    let todayCount = 0;
    
    for (let date in data) {
        for (let key in data[date]) {
            const record = data[date][key];
            
            if (record && record.uid) {
                records.push({
                    uid: record.uid || '',
                    name: record.name || 'Unknown',
                    studentID: record.studentID || key,
                    date: record.date || date,
                    time: record.time || '-',
                    status: record.status || 'present',
                    sortDate: record.date || date,
                    sortTime: record.time || '00:00:00'
                });
                
                if ((record.date || date) === today) {
                    todayCount++;
                }
            }
        }
    }
    
    records.sort((a, b) => {
        if (a.sortDate !== b.sortDate) return b.sortDate.localeCompare(a.sortDate);
        return b.sortTime.localeCompare(a.sortTime);
    });
    
    records.forEach((record, index) => {
        const row = tableBody.insertRow();
        const isToday = record.sortDate === today;
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="student-avatar">
                        ${(record.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <strong>${record.name}</strong>
                </div>
            </td>
            <td>${record.studentID}</td>
            <td>${record.sortDate}</td>
            <td>${record.time}</td>
            <td>
                <span class="status-badge status-${record.status}">
                    ${record.status === 'late' ? '⚠️' : '✅'} 
                    ${record.status.toUpperCase()}
                </span>
            </td>
        `;
        
        if (isToday) {
            row.style.animation = 'fadeIn 0.5s ease';
        }
    });
    
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('totalRecords').textContent = records.length;
    document.getElementById('totalStudents').textContent = TOTAL_STUDENTS;
    
    const now = new Date();
    document.getElementById('lastUpdate').textContent = '🟢 Updated: ' + now.toLocaleTimeString();
    document.getElementById('lastUpdate').style.color = '#4ade80';
    
    console.log(`📊 Loaded: ${records.length} records | Today: ${todayCount}`);
}

// ==========================================================
// ADMIN: LOAD USERS (FROM FIRESTORE)
// ==========================================================
function loadUsers() {
    if (typeof currentUserRole === 'undefined' || currentUserRole !== 'admin') return;
    
    db.collection('users').onSnapshot((snapshot) => {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;
        
        usersList.innerHTML = '';
        let userCount = 0;
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            userCount++;
            const row = usersList.insertRow();
            row.innerHTML = `
                <td>${user.name || 'N/A'}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge role-${user.role || 'viewer'}">
                        ${user.role === 'admin' ? '👑 Admin' : '👤 Viewer'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline" 
                            onclick="changeRole('${doc.id}', '${user.role || 'viewer'}')" 
                            style="width:auto;padding:5px 10px;font-size:12px;">
                        ✏️ Toggle
                    </button>
                </td>
            `;
        });
        
        const statUsers = document.getElementById('statUsers');
        if (statUsers) statUsers.textContent = userCount;
    });
}

// ==========================================================
// ADMIN: CHANGE USER ROLE
// ==========================================================
function changeRole(uid, currentRole) {
    const newRole = currentRole === 'admin' ? 'viewer' : 'admin';
    if (confirm(`Change role to "${newRole}"?`)) {
        db.collection('users').doc(uid).update({ role: newRole })
            .then(() => alert('✅ Role updated!'))
            .catch((e) => alert('❌ ' + e.message));
    }
}

// ==========================================================
// ADMIN: EXPORT CSV
// ==========================================================
function exportToCSV() {
    if (typeof currentUserRole === 'undefined' || currentUserRole !== 'admin') {
        alert('❌ Only admin can export');
        return;
    }
    
    database.ref('attendance').once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            
            if (!data) {
                alert('No data to export');
                return;
            }
            
            let csv = 'Name,Student ID,Date,Time,Status\n';
            
            for (let date in data) {
                for (let key in data[date]) {
                    const record = data[date][key];
                    if (record && record.uid) {
                        csv += `"${record.name}","${record.studentID}","${record.date || date}","${record.time || '-'}","${record.status || 'present'}"\n`;
                    }
                }
            }
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            alert('✅ CSV downloaded successfully!');
        })
        .catch((e) => alert('❌ ' + e.message));
}

// ==========================================================
// QUICK LINKS
// ==========================================================
function openGoogleSheets() {
    if (typeof currentUserRole === 'undefined' || currentUserRole !== 'admin') {
        alert('❌ Only admin can access');
        return;
    }
    window.open(GOOGLE_SHEET_URL, '_blank');
    console.log('📊 Opening Google Sheets...');
}

function openFirebaseConsole() {
    if (typeof currentUserRole === 'undefined' || currentUserRole !== 'admin') {
        alert('❌ Only admin can access');
        return;
    }
    window.open(FIREBASE_CONSOLE_URL, '_blank');
    console.log('☁️ Opening Firebase Console...');
}

// ==========================================================
// ADD STUDENT (ADMIN)
// ==========================================================
function addStudentForm() {
    if (typeof currentUserRole === 'undefined' || currentUserRole !== 'admin') {
        alert('❌ Only admin can add students');
        return;
    }
    
    const name = prompt('👤 Student Name:');
    if (!name) return;
    
    const id = prompt('🆔 Student ID (e.g., STU001):');
    if (!id) return;
    
    const cardUID = prompt('📟 Card UID (format: XX XX XX XX):');
    if (!cardUID) return;
    
    const studentClass = prompt('📚 Class (e.g., IoT 431):', 'IoT 431');
    
    db.collection('students').doc(id).set({
        name: name,
        studentID: id,
        cardUID: cardUID.toUpperCase(),
        class: studentClass || 'IoT 431',
        addedBy: auth.currentUser ? auth.currentUser.email : 'unknown',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert(`✅ Student "${name}" added successfully!\n\nCard UID: ${cardUID.toUpperCase()}\n\n⚠️ Remember to update the ESP32 code with this new card UID!`);
        console.log('✅ Student added:', name, id);
    })
    .catch((e) => alert('❌ ' + e.message));
}

// ==========================================================
// SEARCH FUNCTIONALITY
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#tableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => refreshBtn.style.transform = 'rotate(0deg)', 500);
            loadAttendance();
            if (typeof currentUserRole !== 'undefined' && currentUserRole === 'admin') {
                loadUsers();
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+E = Export CSV
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportToCSV();
        }
        // Ctrl+G = Google Sheets
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            openGoogleSheets();
        }
        // Ctrl+F = Focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }
    });
});

// ==========================================================
// INITIAL LOAD
// ==========================================================
console.log('🚀 Dashboard Ready - Group 3 - AUB - IoT 431');
console.log('📊 Real-Time Mode Active');
console.log('⌨️  Shortcuts: Ctrl+E=Export | Ctrl+G=Sheets | Ctrl+F=Search');