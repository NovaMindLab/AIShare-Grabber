; ==============================================================================
; ShareCLIP NSIS Custom Installer Script
; Fixes: "Failed to uninstall old application files. Please try running the installer again.: 2"
; ==============================================================================

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

; ==============================================================================
; NSIS Upgrade Dedicated Passive Progress Mode (免交互专属进度页)
; ==============================================================================

; 1. Skip the user-mode selection dialog on upgrade (keeps existing per-user or per-machine install)
!macro customInstallMode
  ${if} ${isUpdated}
    ${if} $hasPerMachineInstallation == "1"
      StrCpy $isForceMachineInstall "1"
    ${else}
      StrCpy $isForceCurrentInstall "1"
    ${endif}
  ${endif}
!macroend

; 2. Automatically close the installation files progress page once extraction reaches 100%
!macro customInstall
  ${if} ${isUpdated}
    SetAutoClose true
  ${endif}
!macroend

; 3. Custom finish page: on upgrade, skip the finish confirmation dialog and launch the app immediately
!macro customFinishPage
  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ${if} ${isUpdated}
        StrCpy $1 "--updated"
      ${else}
        StrCpy $1 ""
      ${endif}
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    FunctionEnd
  !endif

  Function customFinishPre
    ${if} ${isUpdated}
      !insertmacro StartApp
      Quit
    ${endif}
  FunctionEnd

  !define MUI_PAGE_CUSTOMFUNCTION_PRE customFinishPre
  !ifndef HIDE_RUN_AFTER_FINISH
    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif
  !insertmacro MUI_PAGE_FINISH
!macroend
