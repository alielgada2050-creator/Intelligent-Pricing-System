# ============================================================
#  العقد الموحد 2026 — تقوية أمان الويندز
#  Windows Security Hardening Script — Run as Administrator
#  تاريخ: 2026-08-17
# ============================================================
#  الطريقة: كليك يمين على الملف → Run with PowerShell
#  أو افتح PowerShell كمسؤول: .\SECURITY_HARDEN.ps1
# ============================================================

$ErrorActionPreference = 'Continue'
$log = @()

function Log($msg) {
    $t = Get-Date -Format "HH:mm:ss"
    $line = "[$t] $msg"
    Write-Host $line -ForegroundColor Cyan
    $script:log += $line
}

Log "=== بدء تقوية أمان الويندز ==="

# ─────────────────────────────────────────────────────────────
# 1. الجدار الناري: حظر الوارد افتراضياً + تفعيل السجلات
# ─────────────────────────────────────────────────────────────
Log "--- [1/6] تقوية الجدار الناري ---"
Set-NetFirewallProfile -Profile Domain,Public,Private `
    -DefaultInboundAction Block `
    -DefaultOutboundAction Allow `
    -LogAllowed True `
    -LogBlocked True `
    -LogFileName "%SystemRoot%\System32\LogFiles\Firewall\pfirewall.log" `
    -LogMaxSizeKilobytes 16384
Log "تم: حظر الوارد افتراضياً + تفعيل السجلات"

# ─────────────────────────────────────────────────────────────
# 2. حظر قواعد SMB/File Sharing الخطيرة على الشبكة العامة
# ─────────────────────────────────────────────────────────────
Log "--- [2/6] حظر قواعد المشاركة الخطيرة ---"
$dangerousRules = @(
    'File and Printer Sharing (SMB-In)',
    'File and Printer Sharing (NB-Session-In)',
    'File and Printer Sharing (NB-Name-In)',
    'File and Printer Sharing (NB-Datagram-In)',
    'File and Printer Sharing (Spooler Service - RPC)',
    'File and Printer Sharing (Spooler Service - RPC-EPMAP)',
    'File and Printer Sharing (Spooler Service Worker - RPC)',
    'File and Printer Sharing (Echo Request - ICMPv4-In)',
    'File and Printer Sharing (Echo Request - ICMPv6-In)',
    'File and Printer Sharing (LLMNR-UDP-In)',
    'Network Discovery (NB-Datagram-In)',
    'Network Discovery (NB-Name-In)',
    'Network Discovery (SSDP-In)',
    'Network Discovery (UPnP-In)',
    'Network Discovery (WSD-In)',
    'Network Discovery (LLMNR-UDP-In)',
    'Network Discovery (WSD Events-In)',
    'Network Discovery (WSD EventsSecure-In)',
    'Network Discovery for Teredo (SSDP-In)',
    'Network Discovery for Teredo (UPnP-In)',
    'Remote Assistance (DCOM-In)',
    'Remote Assistance (PNRP-In)',
    'Remote Assistance (RA Server TCP-In)',
    'Remote Assistance (SSDP TCP-In)',
    'Remote Assistance (SSDP UDP-In)',
    'Remote Assistance (TCP-In)',
    'Cast to Device SSDP Discovery (UDP-In)',
    'Cast to Device UPnP Events (TCP-In)',
    'DIAL protocol server (HTTP-In)',
    'Wireless Display (TCP-In)',
    'Wireless Display Infrastructure Back Channel (TCP-In)'
)
$disabled = 0
foreach ($name in $dangerousRules) {
    $rules = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
    if ($rules) {
        foreach ($r in $rules) {
            if ($r.Enabled -eq 'True') {
                $r | Disable-NetFirewallRule -ErrorAction SilentlyContinue
                $disabled++
            }
        }
    }
}
Log "تم تعطيل $disabled قاعدة خطرة"

# ─────────────────────────────────────────────────────────────
# 3. تعطيل قواعد التطبيقات غير الضرورية على العامة
# ─────────────────────────────────────────────────────────────
Log "--- [3/6] حظر تطبيقات غير ضرورية على Public ---"
$publicApps = @(
    'adb.exe',
    'capcut.exe',
    'tiktoklivestudio',
    'qBittorrent',
    'dartvm.exe',
    'eFootballT',
    'Need for SpeedT Most Wanted'
)
$disabledApps = 0
foreach ($name in $publicApps) {
    $rules = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
    if ($rules) {
        foreach ($r in $rules) {
            if ($r.Enabled -eq 'True' -and $r.Profile -match 'Public') {
                $r | Disable-NetFirewallRule -ErrorAction SilentlyContinue
                $disabledApps++
            }
        }
    }
}
Log "تم تعطيل $disabledApps قاعدة تطبيق على الشبكة العامة"

# ─────────────────────────────────────────────────────────────
# 4. تعطيل NetBIOS عبر السجل
# ─────────────────────────────────────────────────────────────
Log "--- [4/6] تعطيل NetBIOS over TCP/IP ---"
$adapters = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true }
foreach ($adapter in $adapters) {
    $adapterIndex = $adapter.SettingID
    $regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\NetBT\Parameters\Interfaces\Tcpip_$adapterIndex"
    if (Test-Path $regPath) {
        Set-ItemProperty -Path $regPath -Name "NetbiosOptions" -Value 2 -ErrorAction SilentlyContinue
        Log "تم تعطيل NetBIOS: $($adapter.Description)"
    }
}

# ─────────────────────────────────────────────────────────────
# 5. تعطيل خدمات غير ضرورية
# ─────────────────────────────────────────────────────────────
Log "--- [5/6] تعطيل خدمات غير ضرورية ---"
$servicesToDisable = @(
    @{Name='RemoteRegistry'; Msg='Remote Registry'},
    @{Name='W3SVC'; Msg='IIS Web Server'},
    @{Name='SNMP'; Msg='SNMP Service'},
    @{Name='SSDPSRV'; Msg='SSDP Discovery'},
    @{Name='upnphost'; Msg='UPnP Device Host'},
    @{Name='TlntSvr'; Msg='Telnet'},
    @{Name='SharedAccess'; Msg='Internet Connection Sharing'},
    @{Name='RpcSs'; Msg='RPC (careful)'}
)
foreach ($svc in $servicesToDisable) {
    $s = Get-Service -Name $svc.Name -ErrorAction SilentlyContinue
    if ($s -and $s.Status -eq 'Running' -and $svc.Name -ne 'RpcSs') {
        Stop-Service -Name $svc.Name -Force -ErrorAction SilentlyContinue
        Set-Service -Name $svc.Name -StartupType Disabled -ErrorAction SilentlyContinue
        Log "تم تعطيل: $($svc.Msg)"
    } elseif ($s -and $s.StartType -ne 'Disabled') {
        Set-Service -Name $svc.Name -StartupType Disabled -ErrorAction SilentlyContinue
        Log "تم تعطيل بدء تشغيل: $($svc.Msg)"
    }
}

# ─────────────────────────────────────────────────────────────
# 6. تفعيل DNS الآمن + تعطيل LLMNR
# ─────────────────────────────────────────────────────────────
Log "--- [6/6] إعداد DNS الآمن و تعطيل LLMNR ---"
# DNS آمن: Google + Cloudflare
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("8.8.8.8","1.1.1.1","8.8.4.4","1.0.0.1")
Log "تم: DNS = Google (8.8.8.8) + Cloudflare (1.1.1.1)"

# تعطيل LLMNR عبر السجل
$llmnrPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient"
if (!(Test-Path $llmnrPath)) { New-Item -Path $llmnrPath -Force | Out-Null }
Set-ItemProperty -Path $llmnrPath -Name "EnableMulticast" -Value 0
Log "تم: تعطيل LLMNR (Link-Local Multicast Name Resolution)"

# تعطيل mDNS عبر السجل
$mdnsPath = "HKLM:\SYSTEM\CurrentControlSet\Services\Dnscache\Parameters"
Set-ItemProperty -Path $mdnsPath -Name "EnableMDNS" -Value 0 -ErrorAction SilentlyContinue
Log "تم: تعطيل mDNS"

# ─────────────────────────────────────────────────────────────
# ملخص النتائج
# ─────────────────────────────────────────────────────────────
Log ""
Log "============================================"
Log "=== تم بنجاح! ملخص التقوية ==="
Log "============================================"
Log ""
Log "الجدار الناري:"
Get-NetFirewallProfile | Select-Object Name, DefaultInboundAction, LogBlocked | Format-Table -AutoSize | Out-String | ForEach-Object { Log $_ }
Log ""
Log "الشبكة:"
Get-NetIPAddress -InterfaceAlias "Ethernet" -AddressFamily IPv4 | Select-Object IPAddress, PrefixLength | Format-Table -AutoSize | Out-String | ForEach-Object { Log $_ }
Log ""
Log "DNS:"
Get-DnsClientServerAddress -InterfaceAlias "Ethernet" -AddressFamily IPv4 | Format-Table -AutoSize | Out-String | ForEach-Object { Log $_ }
Log ""
Log "NetBIOS:"
$adapters | ForEach-Object {
    $idx = $_.SettingID
    $regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\NetBT\Parameters\Interfaces\Tcpip_$idx"
    $val = (Get-ItemProperty -Path $regPath -Name "NetbiosOptions" -ErrorAction SilentlyContinue).NetbiosOptions
    $status = switch($val) { 0 {'Use DHCP'} 1 {'Enable'} 2 {'DISABLED'} default {'Unknown'} }
    Log "$($_.Description): NetBIOS = $status"
}
Log ""
Log "=== احفظ هذا التقرير ==="

# حفظ التقرير
$logPath = "D:\نظام التسعير العقد الموحد 2026\SECURITY_HARDEN_LOG.txt"
$log | Out-File -FilePath $logPath -Encoding UTF8 -Force
Log "تم حفظ السجل: $logPath"

Write-Host "`nاضغط أي مفتاح للإغلاق..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
