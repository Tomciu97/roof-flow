import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CalculationBreakdown, WizardState } from "@/lib/types";
import {
  COVERING_LABELS,
  FACADE_LABELS,
  INSULATION_LABELS,
  ROOF_TYPE_LABELS,
} from "@/lib/constants";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  brand: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  section: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  heading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#134e4a",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  muted: { color: "#64748b" },
  totalBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0fdfa",
    borderRadius: 4,
  },
  total: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#94a3b8",
  },
});

function fmt(n: number) {
  return `${Math.round(n).toLocaleString("pl-PL")} zł`;
}

function fmtM2(n: number) {
  return `${n.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} m²`;
}

export function ReportDocument({
  state,
  result,
  companyName,
}: {
  state: WizardState;
  result: CalculationBreakdown;
  companyName?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>RoofFlow</Text>
        <Text style={styles.title}>
          Raport wyceny dachu, poddasza i elewacji
        </Text>
        {companyName ? (
          <Text style={{ marginBottom: 12 }}>Przygotowano dla: {companyName}</Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.heading}>Parametry geometrii</Text>
          <View style={styles.row}>
            <Text>Wymiary rzutu</Text>
            <Text>
              {state.lengthM} × {state.widthM} m
            </Text>
          </View>
          <View style={styles.row}>
            <Text>Typ dachu</Text>
            <Text>{ROOF_TYPE_LABELS[state.roofType]}</Text>
          </View>
          <View style={styles.row}>
            <Text>Kąt / okap</Text>
            <Text>
              {state.pitchDeg}° / {state.eavesM} m
            </Text>
          </View>
          <View style={styles.row}>
            <Text>Powierzchnia połaci (z odpadem)</Text>
            <Text>{fmtM2(result.roofAreaWithWasteM2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Pokrycie i dodatki</Text>
          <View style={styles.row}>
            <Text>Pokrycie</Text>
            <Text>{COVERING_LABELS[state.covering]}</Text>
          </View>
          <View style={styles.row}>
            <Text>Rynny</Text>
            <Text>{state.gutters ? "Tak" : "Nie"}</Text>
          </View>
          <View style={styles.row}>
            <Text>Okna dachowe</Text>
            <Text>{state.roofWindows} szt.</Text>
          </View>
          <View style={styles.row}>
            <Text>Koszt pokrycia</Text>
            <Text>{fmt(result.coveringCost)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Koszt więźby / drewna</Text>
            <Text>{fmt(result.timberCost)}</Text>
          </View>
        </View>

        {state.insulationEnabled ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Ocieplenie poddasza</Text>
            <View style={styles.row}>
              <Text>Materiał</Text>
              <Text>
                {INSULATION_LABELS[state.insulationMaterial]} (
                {state.insulationThicknessCm} cm)
              </Text>
            </View>
            <View style={styles.row}>
              <Text>Powierzchnia izolacji</Text>
              <Text>{fmtM2(result.insulationAreaM2)}</Text>
            </View>
            <View style={styles.row}>
              <Text>Koszt</Text>
              <Text>{fmt(result.insulationCost)}</Text>
            </View>
          </View>
        ) : null}

        {state.facadeEnabled ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Ocieplenie elewacji</Text>
            <View style={styles.row}>
              <Text>Materiał</Text>
              <Text>{FACADE_LABELS[state.facadeMaterial]}</Text>
            </View>
            <View style={styles.row}>
              <Text>Powierzchnia netto</Text>
              <Text>{fmtM2(result.facadeNetAreaM2)}</Text>
            </View>
            <View style={styles.row}>
              <Text>Koszt</Text>
              <Text>{fmt(result.facadeCost)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.heading}>Robocizna i suma</Text>
          <View style={styles.row}>
            <Text>Robocizna</Text>
            <Text>{fmt(result.laborCost)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Dodatki (rynny / okna)</Text>
            <Text>{fmt(result.extrasCost)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Suma bazowa</Text>
            <Text>{fmt(result.baseTotal)}</Text>
          </View>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.total}>
            Widełka wyceny: {fmt(result.priceMin)} – {fmt(result.priceMax)}
          </Text>
          <Text style={[styles.muted, { marginTop: 4 }]}>
            Wartości orientacyjne. Ostateczna oferta po pomiarze.
          </Text>
        </View>

        <Text style={styles.footer}>
          Wygenerowano przez RoofFlow · {new Date().toLocaleDateString("pl-PL")} ·
          Dokument nie stanowi oferty w rozumieniu KC.
        </Text>
      </Page>
    </Document>
  );
}
