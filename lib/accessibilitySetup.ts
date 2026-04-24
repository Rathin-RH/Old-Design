import { Capacitor } from '@capacitor/core';

/**
 * Helper class for Accessibility Service setup
 */
export class AccessibilitySetup {
  /**
   * Check if running on native Android
   */
  static isNativeAndroid(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  /**
   * Check if accessibility service might be enabled
   * Note: We can't directly check this from JavaScript, but we can guide users
   */
  static async isAccessibilityEnabled(): Promise<boolean> {
    if (!this.isNativeAndroid()) {
      return false;
    }

    // Store in localStorage if user has completed setup
    const hasSetup = localStorage.getItem('accessibility_setup_complete');
    return hasSetup === 'true';
  }

  /**
   * Mark accessibility setup as complete
   */
  static markSetupComplete(): void {
    localStorage.setItem('accessibility_setup_complete', 'true');
  }

  /**
   * Reset setup flag (for testing or if user disabled)
   */
  static resetSetupFlag(): void {
    localStorage.removeItem('accessibility_setup_complete');
  }

  /**
   * Get instructions for enabling accessibility service
   */
  static getSetupInstructions(): string[] {
    return [
      'Open Settings on your tablet',
      'Navigate to Accessibility',
      'Scroll down to "Downloaded services" or "Installed services"',
      'Find "VPrint Auto-Print"',
      'Toggle the switch to ON',
      'Confirm the warning dialog by tapping "Allow" or "OK"',
      'Return to VPrint app',
    ];
  }

  /**
   * Show setup instructions to user
   */
  static showSetupDialog(): void {
    const instructions = this.getSetupInstructions();
    const message = `To enable automatic printing, please activate the VPrint Auto-Print service:\n\n${instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    alert(message);
  }
}





