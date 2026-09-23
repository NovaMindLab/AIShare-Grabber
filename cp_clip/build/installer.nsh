; ==============================================================================
; ShareCLIP NSIS Custom Installer Script
; Fixes: "Failed to uninstall old application files. Please try running the installer again.: 2"
; ==============================================================================

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
