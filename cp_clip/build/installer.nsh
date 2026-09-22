; ==============================================================================
; ShareCLIP NSIS Custom Installer Script
; Fixes: "Failed to uninstall old application files. Please try running the installer again.: 2"
; Supports: Passive update mode (shows progress bar, zero clicks, auto-restart)
; ==============================================================================

; ------------------------------------------------------------------------------
; 0. Additional command line flags (without overriding native isUpdated)
; ------------------------------------------------------------------------------
!macro _isPassive _a _b _t _f
  ${StdUtils.TestParameter} $R9 "passive"
  StrCmp "$R9" "true" `${_t}` `${_f}`
!macroend
!define isPassive `"" isPassive ""`

; ------------------------------------------------------------------------------
; 1. Process termination before installation starts
; ------------------------------------------------------------------------------
!macro customInit
  ; Terminate any running ShareCLIP main process and helper sub-processes before installation begins
  DetailPrint "Ensuring all ShareCLIP processes are closed..."
  nsExec::Exec `cmd.exe /c taskkill /f /im ShareCLIP.exe /t 2>nul`
  nsExec::Exec `cmd.exe /c taskkill /f /im ble_signaling_server.exe /t 2>nul`
  Sleep 600
!macroend

!macro customCheckAppRunning
  ; Robust process kill override ensuring tree-kill of helper child processes
  DetailPrint "Terminating existing ShareCLIP instances..."
  nsExec::Exec `cmd.exe /c taskkill /f /im ShareCLIP.exe /t 2>nul`
  nsExec::Exec `cmd.exe /c taskkill /f /im ble_signaling_server.exe /t 2>nul`
  Sleep 600
!macroend

!macro customUnInit
  ; Terminate any helper processes before uninstaller attempts to delete or rename files
  DetailPrint "Stopping helper processes before cleanup..."
  nsExec::Exec `cmd.exe /c taskkill /f /im ble_signaling_server.exe /t 2>nul`
  nsExec::Exec `cmd.exe /c taskkill /f /im ShareCLIP.exe /t 2>nul`
  Sleep 500
!macroend

!macro customRemoveFiles
  ; Bypass fragile atomicRMDir (which aborts if any temporary file is locked)
  ; Directly clean up directory without aborting installation
  DetailPrint "Cleaning up previous installation files..."
  RMDir /r "$INSTDIR"
!macroend

!macro customUnInstallCheck
  ; CRITICAL FIX:
  ; When upgrading, if the previous version uninstaller exited with code 2 (e.g. Abort due to locked/temp file),
  ; do NOT pop up "Failed to uninstall old application files: 2" and do NOT abort the installation.
  ; Instead, log it and allow the installer to proceed to overwrite existing files cleanly.
  DetailPrint "Previous uninstaller finished with code $R0. Proceeding with installation..."
!macroend

!macro customUnInstallCheckCurrentUser
  DetailPrint "Previous uninstaller finished with code $R0. Proceeding with installation..."
!macroend

; ------------------------------------------------------------------------------
; 2. Skip User Mode Selection page when updating or running in passive mode
; ------------------------------------------------------------------------------
!macro customInstallMode
  ${if} ${isUpdated}
  ${OrIf} ${isPassive}
    ${if} $hasPerMachineInstallation == "1"
      StrCpy $hasPerMachineInstallation "1"
      StrCpy $hasPerUserInstallation "0"
      ${ifNot} ${UAC_IsAdmin}
        ShowWindow $HWNDPARENT 0
        !insertmacro UAC_RunElevated
        Quit
      ${endIf}
      !insertmacro setInstallModePerAllUsers
      Abort
    ${else}
      StrCpy $hasPerMachineInstallation "0"
      StrCpy $hasPerUserInstallation "1"
      !insertmacro setInstallModePerUser
      Abort
    ${endif}
  ${endif}
!macroend

; ------------------------------------------------------------------------------
; 3. Auto-close Finish page and auto-launch application when updating
; ------------------------------------------------------------------------------
!macro customFinishPage
  Function customFinishPagePre
    ${if} ${isUpdated}
    ${OrIf} ${isPassive}
      ; On update/passive mode, launch new version immediately and exit installer without showing finish page
      ${if} $launchLink != ""
      ${andIf} ${FileExists} "$launchLink"
        ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "--updated"
      ${else}
        ${StdUtils.ExecShellAsUser} $0 "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "open" "--updated"
      ${endif}
      Quit
    ${endif}
  FunctionEnd

  Function customFinishPageRunApp
    ${if} ${isUpdated}
    ${OrIf} ${isPassive}
      StrCpy $1 "--updated"
    ${else}
      StrCpy $1 ""
    ${endif}
    ${if} $launchLink != ""
    ${andIf} ${FileExists} "$launchLink"
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    ${else}
      ${StdUtils.ExecShellAsUser} $0 "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "open" "$1"
    ${endif}
  FunctionEnd

  !define MUI_PAGE_CUSTOMFUNCTION_PRE customFinishPagePre
  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_FUNCTION "customFinishPageRunApp"
  !insertmacro MUI_PAGE_FINISH
!macroend
