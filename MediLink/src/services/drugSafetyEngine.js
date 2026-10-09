/**
 * MediLink Clinical Drug-Drug Interaction (DDI) & Patient Safety Engine
 * 
 * Clinical Rule-Based Analysis of active pharmaceutical ingredients,
 * drug-drug interactions, duplicate therapeutic class hazards, and dosage thresholds.
 */

// Known clinical drug interactions database
export const KNOWN_INTERACTIONS = [
  {
    drugs: ["paracetamol", "ibuprofen"],
    severity: "Moderate",
    title: "Concomitant NSAID & Antipyretic Co-Administration",
    description:
      "Simultaneous consumption of Paracetamol and Ibuprofen may overload hepatic and renal elimination pathways. Stagger intake by at least 4 hours.",
    recommendation: "Advise patient to alternate doses every 4 to 6 hours rather than concurrent ingestion.",
  },
  {
    drugs: ["azithromycin", "pantoprazole"],
    severity: "Moderate",
    title: "Gastric pH-Mediated Antibiotic Absorption Alteration",
    description:
      "PPI reduction of gastric acidity may marginally delay Azithromycin absorption peak. Monitor therapeutic response.",
    recommendation: "Administer Azithromycin 1 hour before or 2 hours after proton-pump inhibitors.",
  },
  {
    drugs: ["azithromycin", "omeprazole"],
    severity: "Moderate",
    title: "CYP3A4 Metabolic Interaction & pH Alteration",
    description:
      "Both agents utilize hepatic CYP enzymes; Omeprazole's acid suppression can reduce macrolide bioavailability.",
    recommendation: "Separate administration intervals by at least 2 hours.",
  },
  {
    drugs: ["metformin", "pantoprazole"],
    severity: "Low",
    title: "Vitamin B12 Malabsorption Risk with Long-Term PPI Co-Therapy",
    description:
      "Both Metformin and prolonged PPI use reduce ileal intrinsic factor absorption, increasing anemia risk.",
    recommendation: "Ensure periodic serum B12 and hemoglobin checks during chronic concurrent therapy.",
  },
  {
    drugs: ["insulin", "metformin"],
    severity: "Moderate",
    title: "Synergistic Antidiabetic Hypoglycemia Risk",
    description:
      "Dual insulin secretagogue/sensitizer action significantly intensifies hypoglycemic events if meals are delayed.",
    recommendation: "Counsel patient on carrying fast-acting glucose tablets and frequent self-monitoring of blood glucose.",
  },
  {
    drugs: ["amoxicillin", "cetirizine"],
    severity: "Safe",
    title: "No Adverse Clinical Interaction Found",
    description: "Amoxicillin and Cetirizine possess distinct clearance routes and no pharmacological contraindication.",
    recommendation: "Safe to dispense concurrently as prescribed.",
  },
];

/**
 * Check a list of medicines (e.g. from POS cart) for drug-drug interactions and duplicate active ingredients.
 * @param {Array<{ name: string, generic?: string, qty?: number }>} items
 * @returns {{ hasAlerts: boolean, alerts: Array, duplicateIngredients: Array, safetyScore: number }}
 */
export function analyzePrescriptionSafety(items = []) {
  if (!items || items.length === 0) {
    return { hasAlerts: false, alerts: [], duplicateIngredients: [], safetyScore: 100 };
  }

  const alerts = [];
  const duplicateIngredients = [];
  const normalizedItems = items.map((it) => ({
    rawName: it.name,
    generic: (it.generic || it.name || "").toLowerCase(),
    brand: (it.brand || it.name || "").toLowerCase(),
    qty: it.qty || 1,
  }));

  // 1. Check for Duplicate Active Ingredients (e.g. Dolo 650 + Crocin 650)
  const genericMap = {};
  normalizedItems.forEach((it) => {
    // Extract key generic names (Paracetamol, Metformin, etc.)
    let genKey = it.generic;
    if (genKey.includes("paracetamol")) genKey = "Paracetamol";
    else if (genKey.includes("azithromycin")) genKey = "Azithromycin";
    else if (genKey.includes("metformin")) genKey = "Metformin";
    else if (genKey.includes("pantoprazole")) genKey = "Pantoprazole";
    else if (genKey.includes("omeprazole")) genKey = "Omeprazole";
    else if (genKey.includes("amoxicillin")) genKey = "Amoxicillin";
    else if (genKey.includes("cetirizine")) genKey = "Cetirizine";
    else if (genKey.includes("ibuprofen")) genKey = "Ibuprofen";
    else if (genKey.includes("insulin")) genKey = "Insulin";

    if (!genericMap[genKey]) {
      genericMap[genKey] = [it.rawName];
    } else {
      genericMap[genKey].push(it.rawName);
    }
  });

  Object.entries(genericMap).forEach(([genKey, names]) => {
    if (names.length > 1) {
      duplicateIngredients.push({
        ingredient: genKey,
        medicines: names,
        severity: "Critical",
        title: `Duplicate Ingredient Toxicity Hazard: ${genKey}`,
        description: `Patient is being dispensed multiple products containing '${genKey}' (${names.join(" + ")}). Combined ingestion risks acute toxic overdose.`,
        recommendation: `Confirm with the prescriber. Do not dispense duplicate formulations simultaneously without adjusted dosage.`,
      });
    }
  });

  // 2. Check for Pairwise Drug-Drug Interactions
  for (let i = 0; i < normalizedItems.length; i++) {
    for (let j = i + 1; j < normalizedItems.length; j++) {
      const itemA = normalizedItems[i];
      const itemB = normalizedItems[j];

      KNOWN_INTERACTIONS.forEach((rule) => {
        const drugA = rule.drugs[0];
        const drugB = rule.drugs[1];

        const matchDirect =
          (itemA.generic.includes(drugA) || itemA.brand.includes(drugA)) &&
          (itemB.generic.includes(drugB) || itemB.brand.includes(drugB));

        const matchReverse =
          (itemA.generic.includes(drugB) || itemA.brand.includes(drugB)) &&
          (itemB.generic.includes(drugA) || itemB.brand.includes(drugA));

        if (matchDirect || matchReverse) {
          alerts.push({
            drugPair: [itemA.rawName, itemB.rawName],
            severity: rule.severity,
            title: rule.title,
            description: rule.description,
            recommendation: rule.recommendation,
          });
        }
      });
    }
  }

  const allIssues = [...duplicateIngredients, ...alerts];
  const criticalCount = allIssues.filter((i) => i.severity === "Critical").length;
  const moderateCount = allIssues.filter((i) => i.severity === "Moderate").length;

  let safetyScore = 100;
  if (criticalCount > 0) safetyScore -= criticalCount * 45;
  if (moderateCount > 0) safetyScore -= moderateCount * 20;
  safetyScore = Math.max(10, Math.min(100, safetyScore));

  return {
    hasAlerts: allIssues.length > 0,
    alerts,
    duplicateIngredients,
    allIssues,
    safetyScore,
  };
}
