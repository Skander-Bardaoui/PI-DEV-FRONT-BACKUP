// src/utils/permissions.test.ts

import { describe, it, expect } from 'vitest';
import { PermissionUtils } from './permissions';
import { PermissionType } from '../types/permissions.types';

describe('PermissionUtils', () => {
  describe('hasPermission', () => {
    it('should return true when permission is granted', () => {
      const permissions = 'cudakp';
      expect(PermissionUtils.hasPermission(permissions, PermissionType.CREATE)).toBe(true);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.UPDATE)).toBe(true);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.DELETE)).toBe(true);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.ADD_MEMBER)).toBe(true);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.KICK_MEMBER)).toBe(true);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.PROMOTE)).toBe(true);
    });

    it('should return false when permission is denied', () => {
      const permissions = '------';
      expect(PermissionUtils.hasPermission(permissions, PermissionType.CREATE)).toBe(false);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.UPDATE)).toBe(false);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.DELETE)).toBe(false);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.ADD_MEMBER)).toBe(false);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.KICK_MEMBER)).toBe(false);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.PROMOTE)).toBe(false);
    });

    it('should return false for invalid permission string length', () => {
      expect(PermissionUtils.hasPermission('cud', PermissionType.CREATE)).toBe(false);
      expect(PermissionUtils.hasPermission('', PermissionType.CREATE)).toBe(false);
      expect(PermissionUtils.hasPermission('cudakpextra', PermissionType.CREATE)).toBe(false);
    });

    it('should return false for null or undefined permissions', () => {
      expect(PermissionUtils.hasPermission(null as any, PermissionType.CREATE)).toBe(false);
      expect(PermissionUtils.hasPermission(undefined as any, PermissionType.CREATE)).toBe(false);
    });

    it('should return false for invalid permission type', () => {
      const permissions = 'cudakp';
      expect(PermissionUtils.hasPermission(permissions, -1 as any)).toBe(false);
      expect(PermissionUtils.hasPermission(permissions, 6 as any)).toBe(false);
    });

    it('should handle mixed permissions correctly', () => {
      const permissions = 'cud---';
      expect(PermissionUtils.hasPermission(permissions, PermissionType.CREATE)).toBe(true);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.UPDATE)).toBe(true);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.DELETE)).toBe(true);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.ADD_MEMBER)).toBe(false);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.KICK_MEMBER)).toBe(false);
      expect(PermissionUtils.hasPermission(permissions, PermissionType.PROMOTE)).toBe(false);
    });
  });

  describe('setPermission', () => {
    it('should grant a permission', () => {
      let permissions = '------';
      permissions = PermissionUtils.setPermission(permissions, PermissionType.CREATE, true);
      expect(permissions).toBe('c-----');
      expect(PermissionUtils.hasPermission(permissions, PermissionType.CREATE)).toBe(true);
    });

    it('should deny a permission', () => {
      let permissions = 'cudakp';
      permissions = PermissionUtils.setPermission(permissions, PermissionType.CREATE, false);
      expect(permissions).toBe('-udakp');
      expect(PermissionUtils.hasPermission(permissions, PermissionType.CREATE)).toBe(false);
    });

    it('should handle multiple permission changes', () => {
      let permissions = '------';
      permissions = PermissionUtils.setPermission(permissions, PermissionType.CREATE, true);
      permissions = PermissionUtils.setPermission(permissions, PermissionType.UPDATE, true);
      permissions = PermissionUtils.setPermission(permissions, PermissionType.DELETE, true);
      expect(permissions).toBe('cud---');
    });

    it('should handle invalid permission string by resetting to default', () => {
      let permissions = 'invalid';
      permissions = PermissionUtils.setPermission(permissions, PermissionType.CREATE, true);
      expect(permissions).toBe('c-----');
    });

    it('should handle null/undefined by resetting to default', () => {
      let permissions = null as any;
      permissions = PermissionUtils.setPermission(permissions, PermissionType.CREATE, true);
      expect(permissions).toBe('c-----');
    });
  });

  describe('parsePermissions', () => {
    it('should parse all permissions granted', () => {
      const permissions = 'cudakp';
      const parsed = PermissionUtils.parsePermissions(permissions);
      expect(parsed[PermissionType.CREATE]).toBe(true);
      expect(parsed[PermissionType.UPDATE]).toBe(true);
      expect(parsed[PermissionType.DELETE]).toBe(true);
      expect(parsed[PermissionType.ADD_MEMBER]).toBe(true);
      expect(parsed[PermissionType.KICK_MEMBER]).toBe(true);
      expect(parsed[PermissionType.PROMOTE]).toBe(true);
    });

    it('should parse no permissions granted', () => {
      const permissions = '------';
      const parsed = PermissionUtils.parsePermissions(permissions);
      expect(parsed[PermissionType.CREATE]).toBe(false);
      expect(parsed[PermissionType.UPDATE]).toBe(false);
      expect(parsed[PermissionType.DELETE]).toBe(false);
      expect(parsed[PermissionType.ADD_MEMBER]).toBe(false);
      expect(parsed[PermissionType.KICK_MEMBER]).toBe(false);
      expect(parsed[PermissionType.PROMOTE]).toBe(false);
    });

    it('should parse mixed permissions', () => {
      const permissions = 'cud---';
      const parsed = PermissionUtils.parsePermissions(permissions);
      expect(parsed[PermissionType.CREATE]).toBe(true);
      expect(parsed[PermissionType.UPDATE]).toBe(true);
      expect(parsed[PermissionType.DELETE]).toBe(true);
      expect(parsed[PermissionType.ADD_MEMBER]).toBe(false);
      expect(parsed[PermissionType.KICK_MEMBER]).toBe(false);
      expect(parsed[PermissionType.PROMOTE]).toBe(false);
    });
  });

  describe('validatePermissionString', () => {
    it('should validate correct permission strings', () => {
      expect(PermissionUtils.validatePermissionString('cudakp')).toBe(true);
      expect(PermissionUtils.validatePermissionString('------')).toBe(true);
      expect(PermissionUtils.validatePermissionString('cud---')).toBe(true);
      expect(PermissionUtils.validatePermissionString('-u----')).toBe(true);
    });

    it('should reject invalid characters', () => {
      expect(PermissionUtils.validatePermissionString('xudakp')).toBe(false);
      expect(PermissionUtils.validatePermissionString('cudxkp')).toBe(false);
      expect(PermissionUtils.validatePermissionString('cudakx')).toBe(false);
    });

    it('should reject incorrect length', () => {
      expect(PermissionUtils.validatePermissionString('cud')).toBe(false);
      expect(PermissionUtils.validatePermissionString('cudakpextra')).toBe(false);
      expect(PermissionUtils.validatePermissionString('')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(PermissionUtils.validatePermissionString(null as any)).toBe(false);
      expect(PermissionUtils.validatePermissionString(undefined as any)).toBe(false);
    });
  });

  describe('getRoleDefaultPermissions', () => {
    it('should return correct defaults for each role', () => {
      expect(PermissionUtils.getRoleDefaultPermissions('BUSINESS_OWNER')).toBe('cudakp');
      expect(PermissionUtils.getRoleDefaultPermissions('BUSINESS_ADMIN')).toBe('cud---');
      expect(PermissionUtils.getRoleDefaultPermissions('TEAM_MEMBER')).toBe('-u----');
      expect(PermissionUtils.getRoleDefaultPermissions('ACCOUNTANT')).toBe('-u----');
      expect(PermissionUtils.getRoleDefaultPermissions('CLIENT')).toBe('------');
      expect(PermissionUtils.getRoleDefaultPermissions('SUPPLIER')).toBe('------');
      expect(PermissionUtils.getRoleDefaultPermissions('PLATFORM_ADMIN')).toBe('cudakp');
    });

    it('should return no permissions for unknown role', () => {
      expect(PermissionUtils.getRoleDefaultPermissions('UNKNOWN_ROLE')).toBe('------');
    });
  });

  describe('stringifyPermissions', () => {
    it('should convert parsed permissions back to string', () => {
      const parsed = {
        [PermissionType.CREATE]: true,
        [PermissionType.UPDATE]: true,
        [PermissionType.DELETE]: true,
        [PermissionType.ADD_MEMBER]: false,
        [PermissionType.KICK_MEMBER]: false,
        [PermissionType.PROMOTE]: false,
      };
      expect(PermissionUtils.stringifyPermissions(parsed)).toBe('cud---');
    });

    it('should handle all permissions granted', () => {
      const parsed = {
        [PermissionType.CREATE]: true,
        [PermissionType.UPDATE]: true,
        [PermissionType.DELETE]: true,
        [PermissionType.ADD_MEMBER]: true,
        [PermissionType.KICK_MEMBER]: true,
        [PermissionType.PROMOTE]: true,
      };
      expect(PermissionUtils.stringifyPermissions(parsed)).toBe('cudakp');
    });

    it('should handle no permissions granted', () => {
      const parsed = {
        [PermissionType.CREATE]: false,
        [PermissionType.UPDATE]: false,
        [PermissionType.DELETE]: false,
        [PermissionType.ADD_MEMBER]: false,
        [PermissionType.KICK_MEMBER]: false,
        [PermissionType.PROMOTE]: false,
      };
      expect(PermissionUtils.stringifyPermissions(parsed)).toBe('------');
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true for full permissions', () => {
      expect(PermissionUtils.hasAllPermissions('cudakp')).toBe(true);
    });

    it('should return false for partial permissions', () => {
      expect(PermissionUtils.hasAllPermissions('cud---')).toBe(false);
      expect(PermissionUtils.hasAllPermissions('-u----')).toBe(false);
    });

    it('should return false for no permissions', () => {
      expect(PermissionUtils.hasAllPermissions('------')).toBe(false);
    });
  });

  describe('hasNoPermissions', () => {
    it('should return true for no permissions', () => {
      expect(PermissionUtils.hasNoPermissions('------')).toBe(true);
    });

    it('should return false for any permissions', () => {
      expect(PermissionUtils.hasNoPermissions('cudakp')).toBe(false);
      expect(PermissionUtils.hasNoPermissions('c-----')).toBe(false);
      expect(PermissionUtils.hasNoPermissions('-u----')).toBe(false);
    });
  });

  describe('getGrantedPermissions', () => {
    it('should return all permission names when all granted', () => {
      const granted = PermissionUtils.getGrantedPermissions('cudakp');
      expect(granted).toEqual(['Create', 'Update', 'Delete', 'Add Member', 'Kick Member', 'Promote']);
    });

    it('should return empty array when no permissions granted', () => {
      const granted = PermissionUtils.getGrantedPermissions('------');
      expect(granted).toEqual([]);
    });

    it('should return only granted permissions', () => {
      const granted = PermissionUtils.getGrantedPermissions('cud---');
      expect(granted).toEqual(['Create', 'Update', 'Delete']);
    });

    it('should handle mixed permissions', () => {
      const granted = PermissionUtils.getGrantedPermissions('-u-a--');
      expect(granted).toEqual(['Update', 'Add Member']);
    });
  });
});
