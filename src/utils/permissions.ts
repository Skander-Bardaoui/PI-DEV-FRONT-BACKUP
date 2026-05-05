// src/utils/permissions.ts

import {
  PermissionType,
  ParsedPermissions,
  ROLE_DEFAULT_PERMISSIONS,
} from '../types/permissions.types';

/**
 * Utility class for permission manipulation and validation
 * Mirrors backend PermissionUtil for client-side operations
 */
export class PermissionUtils {
  /**
   * Check if a permission string has a specific permission
   * @param permissions - The 6-character permission string
   * @param type - The permission type to check
   * @returns true if the permission is granted, false otherwise
   */
  static hasPermission(permissions: string, type: PermissionType): boolean {
    if (!permissions || permissions.length !== 6) {
      return false;
    }

    if (type < 0 || type > 5) {
      return false;
    }

    return permissions[type] !== '-';
  }

  /**
   * Set a specific permission in a permission string
   * @param permissions - The 6-character permission string
   * @param type - The permission type to set
   * @param granted - Whether to grant or deny the permission
   * @returns The updated permission string
   */
  static setPermission(
    permissions: string,
    type: PermissionType,
    granted: boolean,
  ): string {
    if (!permissions || permissions.length !== 6) {
      permissions = '------';
    }

    const chars = permissions.split('');
    const permissionChars = ['c', 'u', 'd', 'a', 'k', 'p'];
    chars[type] = granted ? permissionChars[type] : '-';
    return chars.join('');
  }

  /**
   * Parse a permission string into an object for easier manipulation
   * @param permissions - The 6-character permission string
   * @returns Object with boolean values for each permission type
   */
  static parsePermissions(permissions: string): ParsedPermissions {
    const result: Partial<ParsedPermissions> = {};

    for (let i = 0; i < 6; i++) {
      result[i as PermissionType] = this.hasPermission(
        permissions,
        i as PermissionType,
      );
    }

    return result as ParsedPermissions;
  }

  /**
   * Validate permission string format
   * @param permissions - The permission string to validate
   * @returns true if valid, false otherwise
   */
  static validatePermissionString(permissions: string): boolean {
    if (!permissions || permissions.length !== 6) {
      return false;
    }

    const positions = [
      ['c', '-'], // Position 0: Create
      ['u', '-'], // Position 1: Update
      ['d', '-'], // Position 2: Delete
      ['a', '-'], // Position 3: Add member
      ['k', '-'], // Position 4: Kick member
      ['p', '-'], // Position 5: Promote
    ];

    for (let i = 0; i < 6; i++) {
      if (!positions[i].includes(permissions[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get default permissions for a role
   * @param role - The role name
   * @returns The default permission string for the role
   */
  static getRoleDefaultPermissions(role: string): string {
    return ROLE_DEFAULT_PERMISSIONS[role] || '------';
  }

  /**
   * Convert parsed permissions back to a permission string
   * @param parsed - The parsed permissions object
   * @returns The 6-character permission string
   */
  static stringifyPermissions(parsed: ParsedPermissions): string {
    let result = '';
    const permissionChars = ['c', 'u', 'd', 'a', 'k', 'p'];

    for (let i = 0; i < 6; i++) {
      const type = i as PermissionType;
      result += parsed[type] ? permissionChars[i] : '-';
    }

    return result;
  }

  /**
   * Check if a permission string grants all permissions
   * @param permissions - The permission string to check
   * @returns true if all permissions are granted
   */
  static hasAllPermissions(permissions: string): boolean {
    return permissions === 'cudakp';
  }

  /**
   * Check if a permission string grants no permissions
   * @param permissions - The permission string to check
   * @returns true if no permissions are granted
   */
  static hasNoPermissions(permissions: string): boolean {
    return permissions === '------';
  }

  /**
   * Get a human-readable description of permissions
   * @param permissions - The permission string
   * @returns Array of permission names that are granted
   */
  static getGrantedPermissions(permissions: string): string[] {
    const permissionNames = ['Create', 'Update', 'Delete', 'Add Member', 'Kick Member', 'Promote'];
    const granted: string[] = [];

    for (let i = 0; i < 6; i++) {
      if (this.hasPermission(permissions, i as PermissionType)) {
        granted.push(permissionNames[i]);
      }
    }

    return granted;
  }
}
