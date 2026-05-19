# QA Framework — Fire Engineering Calculations

This document provides professional QA rules, validation logic, boundary tests, and implementation recommendations for fire engineering calculation modules. It is intended for website development (frontend + backend), engineering documentation, and production QA.

---

## 1. Fire Load and Geometry

### 1.1 Fire Load Calculation
Formula:
Q = Σ (m_i × H_i)

Where:
- Q — Total fire load (MJ)
- m_i — Mass of combustible material (kg)
- H_i — Calorific value (MJ/kg)

QA Validation Rules:
- Reject negative values for mass or calorific value
- Empty material entries: reject calculation
- Calorific value must be > 0
- Units: kg and MJ/kg only
- Decimal precision: minimum 2 decimal places on inputs, output to 2dp

Example:
- Wood: 100 kg × 18 MJ/kg = 1800 MJ
- Plastic: 20 kg × 35 MJ/kg = 700 MJ
- Q = 2500 MJ

Recommended Warnings:
- Fire load density > 1200 MJ/m² → High hazard warning
- Extremely low fire load (< 50 MJ total) → Confirm with user

### 1.2 Fire Load Density
Formula:
q = Q / A

Checks:
- Area must be > 0
- Practical output range: 0–5000 MJ/m²

Example: q = 2500 MJ / 100 m² = 25 MJ/m²

### 1.3 Heat Release Rate (HRR)
Formula:
HRR = ṁ × ΔH_c

Rules:
- HRR must not be negative
- ΔH_c typical range: 10000–50000 kJ/kg
- Mass loss rate ṁ must be > 0

---

## 2. Area & Volume Calculations

### 2.1 Floor Area
Formula: A = L × W

Checks:
- Reject negative or zero dimensions
- Units: meters only
- Round outputs to 2 decimals

### 2.2 Volume
Formula: V = L × W × H

Checks:
- Height must be > 0
- Warn if height < 2 m (low ceiling)
- Warn if V > 100000 m³ (very large space)

### 2.3 Ventilation Rate
Formula: ACH = (Q × 3600) / V  (or ACH = V / (Q × 3600) depending on variable naming — enforce consistent variable docs)

Checks:
- ACH must not exceed unrealistic values (>100)
- Volume cannot be zero
- Airflow must be > 0

---

## 3. Occupant Load & Exit Width

### 3.1 Occupant Load
Formula: Occupants = Area / OccupantFactor

Rules:
- Occupant factor must be > 0
- Always round up (ceil)
- Area cannot be negative

Example: Area 200 m², factor 1.5 → 134 occupants

### 3.2 Exit Width
Formula: Required Width = Occupants × WidthFactor

Typical width factors:
- Stairs: 7.6 mm/person
- Doors: 5 mm/person

Checks:
- Minimum regulatory width compliance
- Width cannot be negative

---

## 4. Evacuation Time

### 4.1 RSET
Formula: RSET = Detection + Alarm + Pre-movement + Travel

Rules:
- All time components must be ≥ 0 (seconds)
- If RSET > ASET → warning/fail according to margin

### 4.2 ASET Guidance
- Recommended: ASET ≥ 1.5 × RSET

Status logic:
- PASS: ASET > RSET
- WARNING: margin < 20%
- FAIL: ASET < RSET

---

## 5. Fire Extinguisher Calculations

### 5.1 Extinguisher Quantity
Formula: N = Area / CoveragePerExtinguisher

Rules:
- Coverage area must be > 0
- Round up (ceil)
- Minimum 1 extinguisher
- Validate extinguisher type vs hazard (e.g., no water in electrical rooms)

Example: 450 m² with 150 m² coverage → N = 3

Extinguisher reference (typical):
- 4kg ABC Powder: 50–75 m²
- 6kg ABC Powder: 100–150 m²
- 9kg ABC Powder: ~200 m²
- 5kg CO₂: electrical panels only

---

## 6. Hydrant System

### 6.1 Flow Rate
Formula: Q = n × q

Checks:
- Flow > 0
- Warn if suction or supply pressure too low
- Pipe velocity recommended between 1–6 m/s

### 6.2 Pump Power
Formula: P = (ρ g Q H) / η

Rules:
- Efficiency 0 < η ≤ 1
- Head H must be > 0
- Default density ρ = 1000 kg/m³

---

## 7. Sprinkler Demand

### 7.1 Hydraulic Demand
Formula: Q = Density × Area

Checks:
- Density > 0
- Area > 0
- Hazard class required

Recommended densities (mm/min):
- Light Hazard: 4–6
- Ordinary Hazard: 6–12
- Extra Hazard: 12–30

---

## 8. Fire Water Tank

Formula: V = Q × t

Rules:
- Time > 0
- Flow > 0
- Ensure correct time units (convert minutes → seconds as needed)

---

## 9. Foam System Concentrate

Formula: FoamVolume = SolutionVolume × Concentration

Checks:
- Concentration realistic (1%, 3%, 6%)
- Reject >100%

---

## 10. Detection System

### 10.1 Detector Quantity
Formula: N = Area / CoveragePerDetector

Checks:
- Round up
- Verify spacing vs ceiling height

Typical coverage:
- Smoke detector: 84 m²
- Heat detector: 50 m²

---

## 11. Smoke Exhaust Sizing

Formula: Q = Area × AirflowRate

Checks:
- Compartment area and ceiling height required
- Ensure airflow limits are realistic

---

## 12. Fire Resistance Rating

Guidance:
- Low-rise: 1 hour
- Mid-rise: 2 hours
- High-rise: 3 hours

Checks:
- Occupancy classification required
- Height must be > 0

---

## 13. Battery Backup Sizing

Formula: AH = (0.8 × I × t)  (0.8 is derating factor)

Checks:
- Current > 0
- Time > 0
- Warn if battery below code minimum

---

## 14. Cable Derating

Formula: I_d = I_n × C_a × C_g × C_i

Checks:
- All correction factors between 0 and 1
- Current positive

---

## 15. Generator Sizing

Formula: kVA = kW / PF

Checks:
- Power factor 0 < PF ≤ 1
- Demand factor > 0
- Recommend 20–25% spare capacity

---

## Global QA Requirements for Website

Input validation:
- Reject negative numbers and NaN
- Prevent divide-by-zero
- Use clear unit labels and tooltips
- Display errors prominently

Engineering validation statuses:
- PASS — compliant
- WARNING — near limit
- FAIL — unsafe or invalid

Unit consistency (mandatory):
- Length: m
- Area: m²
- Volume: m³
- Flow: L/min or m³/s (document choice)
- Pressure: bar or kPa
- Energy: MJ
- Power: kW

Extinguisher logic and recommendations:
- Auto-recommend extinguisher by building type/hazard
- Validate travel distances and placement
- Flag incompatible extinguisher/hazard combos

Advanced recommended features:
1. Auto Recommendation System (building type, fire class, area → type/capacity/quantity)
2. NFPA/BS standard checks (travel distance, rating, incompatibility warnings)

---

## Implementation Recommendations
- Store canonical unit mappings and conversion utilities centrally (backend + frontend)
- Implement strict input sanitization on backend endpoints
- Mirror validation in frontend for UX but treat backend as source of truth
- Provide PASS/WARNING/FAIL statuses in all calculation endpoints
- Include sample boundary test cases for each calculation (see `tests/` suggestions)

---

## Example Boundary Test Cases (representative)
- Fire load: zero materials → reject
- Fire load: very large mass and calorific values → high hazard warning
- Area: zero → reject
- Volume: extremely large → large-space warning
- Evacuation: ASET just 10% above RSET → WARNING
- Extinguisher: electrical room + water type → FAIL

---

## Next Steps Suggested
1. Add `backend/src/utils/fireQa.js` implementing validation primitives and status enumerations.
2. Add `frontend/src/services/qa.js` for UI-level validation and messages.
3. Add unit tests under `backend/tests/` and `frontend/tests/` with the boundary cases above.

---

## Notes
File created by QA assistant. Provide direction if you want code stubs added next.
