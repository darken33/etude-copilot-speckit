# Tasks - OpenAPI v2.0.0 Compatibility Implementation

**Project**: Accueil Client - Connaissance Client Application  
**Spec Version**: OpenAPI v2.0.0  
**Date**: 27 novembre 2025  
**Status**: Ready for execution

## Overview

This document outlines the tasks required to ensure full compatibility with the OpenAPI v2.0.0 specification. The main changes are:

1. **Expanded SituationFamiliale enum**: From 2 to 5 values
2. **Backend typo fix**: Correct `situationFamilialle` → `situationFamiliale`

## Current State vs. Target State

| Component | Current State | Target State |
|-----------|---------------|--------------|
| Enum Values | CELIBATAIRE, MARIE | CELIBATAIRE, MARIE, DIVORCE, VEUF, PACSE |
| Backend Field | situationFamilialle (typo) | situationFamiliale (correct) |
| Database Field | situationFamilialle (typo) | situationFamiliale (correct) |

---

## Phase 1: Core Type System Updates

### Task 1: Extend SituationFamiliale Enum
- **Priority**: P0 (Blocking)
- **File**: `src/types/api.ts`
- **Status**: Not Started
- **Dependencies**: None
- **Estimated Time**: 2 minutes

**Description**: Add DIVORCE, VEUF, and PACSE to the TypeScript enum definition.

**Current Code**:
```typescript
export enum SituationFamiliale {
  CELIBATAIRE = 'CELIBATAIRE',
  MARIE = 'MARIE'
}
```

**Target Code**:
```typescript
export enum SituationFamiliale {
  CELIBATAIRE = 'CELIBATAIRE',
  MARIE = 'MARIE',
  DIVORCE = 'DIVORCE',
  VEUF = 'VEUF',
  PACSE = 'PACSE'
}
```

**Acceptance Criteria**:
- [ ] TypeScript compiles without errors
- [ ] All 5 enum values are defined
- [ ] Enum values match OpenAPI spec exactly (case-sensitive)

---

## Phase 2: User Interface Updates

### Task 2: Update ClientForm Select Options
- **Priority**: P0 (Blocking)
- **File**: `src/components/ClientForm.tsx`
- **Status**: Not Started
- **Dependencies**: Task 1 (enum definition)
- **Estimated Time**: 3 minutes

**Description**: Add three new options to the situation familiale dropdown with proper French labels.

**Current Options**:
- Célibataire
- Marié(e)

**New Options to Add**:
- Divorcé(e)
- Veuf(ve)
- Pacsé(e)

**Implementation**:
```tsx
<option value={SituationFamiliale.DIVORCE}>Divorcé(e)</option>
<option value={SituationFamiliale.VEUF}>Veuf(ve)</option>
<option value={SituationFamiliale.PACSE}>Pacsé(e)</option>
```

**Acceptance Criteria**:
- [ ] All 5 options are visible in the dropdown
- [ ] Options display correct French labels
- [ ] Enum values are correctly mapped
- [ ] Form validation accepts all 5 values

---

### Task 3: Update formatSituationFamiliale Utility
- **Priority**: P1 (High)
- **File**: `src/utils/validation.ts`
- **Status**: Not Started
- **Dependencies**: Task 1 (enum definition)
- **Estimated Time**: 2 minutes

**Description**: Extend the formatting function to handle the three new situation values for display purposes.

**New Cases to Add**:
```typescript
case SituationFamiliale.DIVORCE:
  return 'Divorcé(e)';
case SituationFamiliale.VEUF:
  return 'Veuf(ve)';
case SituationFamiliale.PACSE:
  return 'Pacsé(e)';
```

**Acceptance Criteria**:
- [ ] Function returns correct French label for each enum value
- [ ] No TypeScript errors or warnings
- [ ] Consistent formatting with existing cases

---

## Phase 3: Backend Mock Corrections

### Task 4: Fix Backend Typo in server.js
- **Priority**: P0 (Blocking)
- **File**: `server.js`
- **Status**: Not Started
- **Dependencies**: None (independent fix)
- **Estimated Time**: 3 minutes

**Description**: Replace all occurrences of the typo `situationFamilialle` with the correct `situationFamiliale`.

**Locations to Fix**:
- Line 60: Validation schema
- Line 194: Object property access
- Line 207: Object property access
- Additional occurrence (4 total)

**Find & Replace**:
- **Find**: `situationFamilialle`
- **Replace**: `situationFamiliale`

**Acceptance Criteria**:
- [ ] All 4 occurrences are corrected
- [ ] Backend mock starts without errors
- [ ] API endpoints respond correctly
- [ ] No remaining references to the typo

---

### Task 5: Fix Database Typo in db.json
- **Priority**: P0 (Blocking)
- **File**: `db.json`
- **Status**: Not Started
- **Dependencies**: Task 4 (backend correction)
- **Estimated Time**: 2 minutes

**Description**: Rename the field key from `situationFamilialle` to `situationFamiliale` for all 8 client records.

**Affected Records**: All 8 test clients (IDs 1-8)

**Find & Replace**:
- **Find**: `"situationFamilialle":`
- **Replace**: `"situationFamiliale":`

**Acceptance Criteria**:
- [ ] All 8 client records updated
- [ ] Valid JSON format maintained
- [ ] Backend reads data correctly after change
- [ ] No parsing errors

---

## Phase 4: Documentation Updates

### Task 6: Update README.md
- **Priority**: P2 (Medium)
- **File**: `README.md`
- **Status**: Not Started
- **Dependencies**: Task 1 (for accurate enum values)
- **Estimated Time**: 2 minutes

**Description**: Update the enum documentation to reflect the expanded SituationFamiliale values.

**Changes**:
- Update enum list from `[CELIBATAIRE, MARIE]` to `[CELIBATAIRE, MARIE, DIVORCE, VEUF, PACSE]`
- Add descriptions for new values if applicable

**Acceptance Criteria**:
- [ ] All 5 enum values documented
- [ ] Descriptions are clear and accurate
- [ ] Markdown formatting is correct

---

### Task 7: Update OVERVIEW.md
- **Priority**: P2 (Medium)
- **File**: `OVERVIEW.md`
- **Status**: Not Started
- **Dependencies**: Task 1
- **Estimated Time**: 3 minutes

**Description**: Update the technical overview, particularly the business validation section, with the complete enum definition.

**Sections to Update**:
- Business validation rules
- Type definitions
- Any enum references in architecture diagrams

**Acceptance Criteria**:
- [ ] Complete enum values listed
- [ ] Validation rules updated if needed
- [ ] Technical accuracy verified

---

### Task 8: Update BACKEND_MOCK.md
- **Priority**: P2 (Medium)
- **File**: `BACKEND_MOCK.md`
- **Status**: Not Started
- **Dependencies**: Tasks 4, 5 (backend corrections)
- **Estimated Time**: 5 minutes

**Description**: Add example API requests and responses demonstrating the new situation familiale values.

**Examples to Add**:
1. POST request with `situationFamiliale: "DIVORCE"`
2. PUT request changing to `situationFamiliale: "VEUF"`
3. PUT request changing to `situationFamiliale: "PACSE"`

**Acceptance Criteria**:
- [ ] At least one example for each new enum value
- [ ] Request/response format is correct
- [ ] Examples use corrected field name (no typo)
- [ ] JSON is valid and properly formatted

---

### Task 9: Update Evaluation Reports
- **Priority**: P3 (Low)
- **Files**: `RAPPORT_EVALUATION_GITHUB_COPILOT.md`, `RAPPORT_EVALUATION_GITHUB_COPILOT.adoc`
- **Status**: Not Started
- **Dependencies**: Task 1
- **Estimated Time**: 3 minutes

**Description**: Update enum references in both Markdown and AsciiDoc evaluation reports.

**Changes**:
- Update SituationFamiliale enum listings
- Verify consistency between .md and .adoc versions

**Acceptance Criteria**:
- [ ] Both report formats updated
- [ ] Enum values are consistent
- [ ] No formatting issues introduced

---

## Phase 5: Testing & Validation

### Task 10: Extend Unit Tests
- **Priority**: P1 (High)
- **File**: `src/__tests__/validation.test.ts`
- **Status**: Not Started
- **Dependencies**: Tasks 1, 3 (enum and formatter)
- **Estimated Time**: 10 minutes

**Description**: Add comprehensive test cases for the three new situation familiale values.

**Test Cases to Add**:
1. **Validation Tests**:
   - Valid DIVORCE value
   - Valid VEUF value
   - Valid PACSE value

2. **Formatting Tests**:
   - formatSituationFamiliale(DIVORCE) → "Divorcé(e)"
   - formatSituationFamiliale(VEUF) → "Veuf(ve)"
   - formatSituationFamiliale(PACSE) → "Pacsé(e)"

3. **Form Tests**:
   - Client creation with DIVORCE
   - Client creation with VEUF
   - Client creation with PACSE

**Acceptance Criteria**:
- [ ] All new tests pass
- [ ] Test coverage maintained or improved
- [ ] Tests follow existing patterns
- [ ] No test regressions

---

### Task 11: Integration Testing & Validation
- **Priority**: P0 (Blocking - final validation)
- **Scope**: Full application
- **Status**: Not Started
- **Dependencies**: All previous tasks
- **Estimated Time**: 15 minutes

**Description**: Comprehensive end-to-end testing to validate OpenAPI v2.0.0 compatibility.

**Test Scenarios**:

1. **UI Verification**:
   - [ ] Navigate to client form
   - [ ] Verify all 5 situation options appear in dropdown
   - [ ] Verify French labels are correct

2. **Client Creation**:
   - [ ] Create client with CELIBATAIRE (existing)
   - [ ] Create client with MARIE (existing)
   - [ ] Create client with DIVORCE (new)
   - [ ] Create client with VEUF (new)
   - [ ] Create client with PACSE (new)
   - [ ] Verify each saves correctly in db.json

3. **Client Modification**:
   - [ ] Load existing client
   - [ ] Change situation to DIVORCE and save
   - [ ] Verify API PUT request succeeds
   - [ ] Verify data persists correctly
   - [ ] Repeat for VEUF and PACSE

4. **Display Verification**:
   - [ ] List all clients
   - [ ] Verify formatSituationFamiliale shows correct labels
   - [ ] Verify no typo-related errors in console

5. **Backend Validation**:
   - [ ] Verify server.js uses correct field name
   - [ ] Verify db.json has no typo occurrences
   - [ ] Verify API responses match OpenAPI spec

6. **OpenAPI Compliance**:
   - [ ] All enum values from spec are supported
   - [ ] Field names match spec exactly
   - [ ] Request/response formats comply with spec

**Acceptance Criteria**:
- [ ] All test scenarios pass without errors
- [ ] No console errors or warnings
- [ ] Application is fully functional with all 5 values
- [ ] OpenAPI v2.0.0 specification is fully implemented

---

## Execution Strategy

### Recommended Order

**Critical Path** (must be done sequentially):
1. Task 1 → Task 2 → Task 3 (Frontend type system)
2. Task 4 → Task 5 (Backend corrections)
3. Task 10 (Tests before final validation)
4. Task 11 (Integration testing)

**Parallel Track** (can be done anytime after Task 1):
- Tasks 6, 7, 8, 9 (Documentation - no dependencies on each other)

### Time Estimate
- **Critical Path**: ~35 minutes
- **Documentation**: ~13 minutes (parallel)
- **Total**: ~35 minutes (with parallel execution)

### Risk Assessment

**Low Risk**:
- Tasks 1, 2, 3 (additive changes, no breaking modifications)
- Tasks 6, 7, 8, 9 (documentation only)

**Medium Risk**:
- Tasks 4, 5 (field rename - ensure complete replacement)

**Testing Required**:
- Task 11 is mandatory before considering work complete

---

## Validation Checklist

Before considering this work complete, verify:

- [ ] TypeScript compiles without errors or warnings
- [ ] All unit tests pass
- [ ] Backend mock starts without errors
- [ ] All 5 situation values work in UI
- [ ] Client creation works with all values
- [ ] Client modification works with all values
- [ ] No typo occurrences remain in codebase
- [ ] Documentation accurately reflects implementation
- [ ] OpenAPI v2.0.0 spec is fully satisfied

---

## Success Metrics

✅ **Compatibility**: Application fully complies with OpenAPI v2.0.0  
✅ **Data Integrity**: Backend typo eliminated, data consistency restored  
✅ **User Experience**: All 5 situation familiale values available and working  
✅ **Test Coverage**: All new enum values have test coverage  
✅ **Documentation**: All docs updated to reflect v2.0.0 changes

---

## Notes

- The typo fix (Tasks 4-5) is independent and can be done first if preferred
- Documentation updates (Tasks 6-9) can be batched together
- Task 11 integration testing is critical - do not skip
- Consider creating a backup of db.json before Task 5
