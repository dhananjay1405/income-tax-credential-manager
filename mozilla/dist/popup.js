"use strict";
var statusType;
(function (statusType) {
    statusType[statusType["Error"] = 0] = "Error";
    statusType[statusType["Info"] = 1] = "Info";
})(statusType || (statusType = {}));
let lstClients = [];
let flgEdit = false;
let flgLockPaste = true;
function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function cleanText(source) {
    source = source.trim().replace(/[\t\r\n\"]/g, '');
    source = source.replace(/\s{2,}/g, ' ');
    return source;
}
function toggleControlState(state, lstCtrl) {
    for (let i = 0; i < lstCtrl.length; i++)
        $(lstCtrl[i]).prop('disabled', !state);
}
function displayStatus(message, status) {
    $('#lblMessage').text(message);
    $('#lblMessage').css('color', status == statusType.Error ? 'red' : 'blue');
    setTimeout(() => {
        $('#lblMessage').text(' ');
    }, 3000);
}
async function loadClients(cb) {
    let d = await browser.storage.local.get();
    if (d && Array.isArray(d['credentials']))
        lstClients = d['credentials'];
    cb();
}
async function saveClients(cb) {
    lstClients = lstClients.sort((a, b) => a.name < b.name ? -1 : 1);
    await browser.storage.local.set({ credentials: lstClients });
    cb();
}
function reloadClientDropdown() {
    $('#ddlClients').children().remove();
    let elSelect = document.getElementById('ddlClients');
    for (let i = 0; i < lstClients.length; i++) {
        let elOptItem = document.createElement('option');
        elOptItem.setAttribute('value', lstClients[i].name);
        if (elSelect)
            elSelect.appendChild(elOptItem);
    }
}
function exportToClipboard() {
    let result = 'name\tuser\tpass\r\n';
    for (let i = 0; i < lstClients.length; i++)
        result += `${lstClients[i].name}\t${lstClients[i].user}\t${lstClients[i].pass}\r\n`;
    result = result.substr(0, result.length - 2);
    $('#txtCopyData').val(result);
    $('#txtCopyData').show();
    $('#txtCopyData').select();
    document.execCommand('copy');
    $('#txtCopyData').hide();
    displayStatus('Data copied. Please paste in Excel', statusType.Info);
}
function importFromClipboard(result) {
    lstClients = [];
    let lstRows = result.split(/\r?\n/);
    for (let i = 0; i < lstRows.length; i++) {
        let row = lstRows[i];
        if (row.toLowerCase() == 'name\tuser\tpass')
            continue;
        let lstColumns = row.split(/\t/);
        if (lstColumns.length != 3)
            continue;
        lstColumns[0] = cleanText(lstColumns[0]);
        if (!lstColumns[0] || !lstColumns[1] || !lstColumns[2])
            continue;
        let obj = {
            name: lstColumns[0],
            user: lstColumns[1],
            pass: lstColumns[2]
        };
        lstClients.push(obj);
    }
    $('#txtPasteData').val('');
    saveClients(() => {
        reloadClientDropdown();
        displayStatus('Client credentials imported. Please click the dropdown', statusType.Info);
        flgEdit = false;
        $('#btnCancel').trigger('click');
    });
}
$(document).ready(async () => {
    let tabs = await browser.tabs.query({ currentWindow: true, active: true });
    let extn = tabs[0];
    if (extn.url && extn.url.indexOf('incometaxindiaefiling.gov.in/e-Filing/UserLogin/') != -1 && extn.id) {
        flgLockPaste = false;
    }
    toggleControlState(false, ['#txtClientName', '#txtClientUser', '#txtClientPass', '#btnSave', '#btnCancel']);
    loadClients(() => {
        reloadClientDropdown();
    });
    $('#btnSave').click(() => {
        let clientName = $('#txtClientName').val();
        let clientUser = $('#txtClientUser').val();
        let clientPass = $('#txtClientPass').val();
        let selectedIndex = lstClients.findIndex(p => p.name == clientName);
        clientName = cleanText(clientName);
        if (!clientName) {
            displayStatus('Client name cannot be blank', statusType.Error);
            return;
        }
        if (!clientUser) {
            displayStatus('User ID cannot be blank', statusType.Error);
            return;
        }
        if (!clientPass) {
            displayStatus('Password cannot be blank', statusType.Error);
            return;
        }
        if (flgEdit) {
            lstClients[selectedIndex].pass = clientPass;
            displayStatus('Client updated', statusType.Info);
        }
        else {
            if (selectedIndex != -1) {
                displayStatus('Duplicate Client', statusType.Error);
                return;
            }
            if (lstClients.findIndex(p => p.user == clientUser) != -1) {
                displayStatus('Duplicate PAN', statusType.Error);
                return;
            }
            lstClients.push({
                name: clientName,
                user: clientUser,
                pass: clientPass
            });
            displayStatus('Client added', statusType.Info);
        }
        saveClients(() => {
            reloadClientDropdown();
            flgEdit = true;
            $('#txtSearch').val(clientName);
            $('#txtSearch').trigger('change');
        });
    });
    $('#btnCancel').click(() => {
        flgEdit = false;
        $('#txtSearch').val('');
        $('#txtClientName').val('');
        $('#txtClientUser').val('');
        $('#txtClientPass').val('');
        $('#btnNewDelete').text('New');
        $('#btnNewDelete').removeClass('btn-danger').addClass('btn-primary');
        toggleControlState(false, ['#txtClientName', '#txtClientUser', '#txtClientPass', '#btnSave', '#btnCancel']);
        toggleControlState(true, ['#txtSearch', '#btnNewDelete']);
    });
    $('#btnNewDelete').click(() => {
        if (flgEdit) {
            let clientName = $('#txtClientName').val();
            let selectedIndex = lstClients.findIndex(p => p.name == clientName);
            lstClients.splice(selectedIndex, 1);
            saveClients(() => {
                reloadClientDropdown();
                displayStatus('Client deleted', statusType.Info);
                $('#btnCancel').trigger('click');
            });
        }
        else {
            toggleControlState(false, ['#txtSearch', '#btnNewDelete']);
            $('#txtSearch').val('');
            $('#txtClientName').val('');
            $('#txtClientUser').val('');
            $('#txtClientPass').val('');
            toggleControlState(true, ['#txtClientName', '#txtClientUser', '#txtClientPass', '#btnSave', '#btnCancel']);
        }
    });
    $('#txtSearch').change(function () {
        let clientName = $('#txtSearch').val();
        let selectedIndex = lstClients.findIndex(p => p.name == clientName);
        if (selectedIndex != -1) {
            flgEdit = true;
            $('#btnNewDelete').text('Delete');
            $('#btnNewDelete').removeClass('btn-primary').addClass('btn-danger');
            let clientName = lstClients[selectedIndex].name;
            let clientUser = lstClients[selectedIndex].user;
            let clientPass = lstClients[selectedIndex].pass;
            $('#txtClientName').val(clientName);
            $('#txtClientUser').val(clientUser);
            $('#txtClientPass').val(clientPass);
            toggleControlState(false, ['#txtClientName', '#txtClientUser']);
            toggleControlState(true, ['#txtSearch', '#txtClientPass', '#btnSave', '#btnCancel', '#btnNewDelete']);
            if (!flgLockPaste)
                toggleControlState(true, ['#btnPasteCredentials']);
        }
    });
    $('#btnPasteCredentials').click(async () => {
        let clientName = $('#txtClientName').val();
        let selectedIndex = lstClients.findIndex(p => p.name == clientName);
        if (selectedIndex !== -1) {
            let user = lstClients[selectedIndex].user;
            let pass = lstClients[selectedIndex].pass;
            let objCredential = { name: '', user, pass };
            let msg = {
                action: 'paste-credential',
                param: objCredential
            };
            let tabs = await browser.tabs.query({ currentWindow: true, active: true });
            let extn = tabs[0];
            if (extn.url && extn.url.indexOf('incometaxindiaefiling.gov.in/e-Filing/UserLogin/') != -1 && extn.id)
                await browser.tabs.sendMessage(extn.id, msg);
            window.close();
        }
    });
    $('#btnExport').click(() => exportToClipboard());
    $('#txtPasteData').on('paste', (e) => {
        e.preventDefault();
        let cpb = e.originalEvent;
        if (cpb.clipboardData) {
            let val = cpb.clipboardData.getData('text');
            importFromClipboard(val);
        }
    });
});
