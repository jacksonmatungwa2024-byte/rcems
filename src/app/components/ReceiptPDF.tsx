// ..components/ReceiptPDF.tsx
import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica"
  },
  header: {
    textAlign: "center",
    marginBottom: 20
  },
  logo: {
    width: 60,
    height: 60,
    margin: "0 auto"
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#4a148c"
  },
  section: {
    marginBottom: 10
  },
  label: {
    fontWeight: "bold"
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontStyle: "italic",
    color: "#333"
  }
})

export const ReceiptPDF = ({ data }: { data: any }) => (
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Image src="/logo.png" style={styles.logo} />
        <Text style={styles.title}>Risiti ya Mchango</Text>
      </View>

      <View style={styles.section}>
        <Text><Text style={styles.label}>Majina:</Text> {data.majina}</Text>
        <Text><Text style={styles.label}>Simu:</Text> {data.simu}</Text>
        <Text><Text style={styles.label}>Mahali:</Text> {data.mahali}</Text>
        <Text><Text style={styles.label}>Muumini Namba:</Text> {data.muumini_namba ?? "—"}</Text>
      </View>

      <View style={styles.section}>
        <Text><Text style={styles.label}>Aina ya Mchango:</Text> {data.mchango_type}</Text>
        <Text><Text style={styles.label}>Lengo:</Text> {data.target}</Text>
        <Text><Text style={styles.label}>Kiasi kilichopangwa:</Text> {data.kiasi_pangwa} TZS</Text>
        <Text><Text style={styles.label}>Kiasi kilicholipwa:</Text> {data.kiasi_lipwa} TZS</Text>
        <Text><Text style={styles.label}>Kiasi kilichopunguzwa:</Text> {data.kiasi_punguzo} TZS</Text>
        <Text><Text style={styles.label}>Bado:</Text> {data.kiasi_bado} TZS</Text>
      </View>

      <View style={styles.section}>
        <Text>{data.kiasi_bado === 0 ? "✅ Mchango umekamilika" : "⏳ Mchango bado unaendelea"}</Text>
      </View>

      <View style={styles.footer}>
        <Text>Asante kwa mchango wako. Mungu akubariki.</Text>
        <Text>Imepokelewa: {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
)
