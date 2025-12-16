import React from "react"
import { Document, Page, Text, StyleSheet, View, Image } from "@react-pdf/renderer"
import type { BrandConfig, PdfWriterData } from "../../types"
import { Header } from "../shared/Header"
import { Footer } from "../shared/Footer"
import { Section } from "../shared/Section"
import { Paragraph, BulletList, Callout } from "../shared/Typography"
import { DataTable, InfoBox, TwoColumn } from "../shared/DataTable"

interface PdfWriterTemplateProps {
  data: PdfWriterData
  brand: BrandConfig
}

function normalizeText(value: string) {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
}

function normalizeLineEndings(value: string) {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

type Block =
  | { kind: "h1" | "h2" | "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "hr" }
  | { kind: "img"; url: string; caption?: string }
  | { kind: "asset"; key: string }

function parseLiteMarkup(input: string): Block[] {
  const lines = normalizeText(input).split("\n")
  const blocks: Block[] = []

  const pushParagraph = (parts: string[]) => {
    const text = parts.join(" ").replace(/\s+/g, " ").trim()
    if (text) blocks.push({ kind: "p", text })
  }

  let paragraph: string[] = []
  let listKind: "ul" | "ol" | null = null
  let listItems: string[] = []

  const flushList = () => {
    if (!listKind) return
    if (listItems.length) blocks.push({ kind: listKind, items: listItems })
    listKind = null
    listItems = []
  }

  const flushParagraph = () => {
    if (!paragraph.length) return
    pushParagraph(paragraph)
    paragraph = []
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      flushList()
      flushParagraph()
      continue
    }

    const imgMatch = line.match(/^!\[(.*?)]\((.*?)\)$/)
    if (imgMatch) {
      flushList()
      flushParagraph()
      const caption = imgMatch[1]?.trim() || undefined
      const url = imgMatch[2]?.trim()
      if (url) blocks.push({ kind: "img", url, caption })
      continue
    }

    const assetMatch = line.match(/^\[\[IMAGE:([a-zA-Z0-9_-]+)\]\]$/)
    if (assetMatch) {
      flushList()
      flushParagraph()
      blocks.push({ kind: "asset", key: assetMatch[1] })
      continue
    }

    if (line === "---") {
      flushList()
      flushParagraph()
      blocks.push({ kind: "hr" })
      continue
    }

    if (line.startsWith("# ")) {
      flushList()
      flushParagraph()
      blocks.push({ kind: "h1", text: line.slice(2).trim() })
      continue
    }
    if (line.startsWith("## ")) {
      flushList()
      flushParagraph()
      blocks.push({ kind: "h2", text: line.slice(3).trim() })
      continue
    }
    if (line.startsWith("### ")) {
      flushList()
      flushParagraph()
      blocks.push({ kind: "h3", text: line.slice(4).trim() })
      continue
    }

    const ulMatch = line.match(/^[-*]\s+(.*)$/)
    if (ulMatch) {
      flushParagraph()
      if (listKind && listKind !== "ul") flushList()
      listKind = "ul"
      const item = ulMatch[1].trim()
      if (item) listItems.push(item)
      continue
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/)
    if (olMatch) {
      flushParagraph()
      if (listKind && listKind !== "ol") flushList()
      listKind = "ol"
      const item = olMatch[1].trim()
      if (item) listItems.push(item)
      continue
    }

    if (listKind) flushList()
    paragraph.push(line)
  }

  flushList()
  flushParagraph()
  return blocks
}

export function PdfWriterTemplate({ data, brand }: PdfWriterTemplateProps) {
  const title = (data?.title || "Document").trim()
  const reference = typeof data?.reference === "string" ? data.reference.trim() : undefined
  const mode = data?.mode === "strict" ? "strict" : data?.mode === "format" ? "format" : "rewrite"
  const rawBody = normalizeLineEndings(data?.body || "")
  const body = mode === "strict" ? rawBody : normalizeText(rawBody)
  const blocks = mode === "strict" ? [] : parseLiteMarkup(body)
  const layout = (data?.layout ?? null) as NonNullable<PdfWriterData["layout"]> | null
  const sections = Array.isArray(layout?.sections) ? layout!.sections! : []
  const assetMap = new Map<string, { url: string; caption?: string | null }>()
  if (Array.isArray(data?.assets)) {
    for (const a of data.assets) {
      const key = typeof a?.key === "string" ? a.key.trim() : ""
      const url = typeof a?.url === "string" ? a.url.trim() : ""
      if (!key || !url) continue
      assetMap.set(key, { url, caption: typeof a?.caption === "string" ? a.caption : null })
    }
  }

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      paddingTop: brand.layout.pageMargin,
      paddingBottom: brand.layout.footerHeight + 30,
      paddingHorizontal: brand.layout.pageMargin,
      color: brand.colors.text,
    },
    meta: {
      marginBottom: 10,
    },
    metaLine: {
      fontSize: 8,
      color: brand.colors.muted,
      marginBottom: 2,
    },
    h1: {
      fontSize: 16,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 8,
    },
    h2: {
      fontSize: 12,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginTop: 6,
      marginBottom: 6,
    },
    h3: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.secondary,
      marginTop: 4,
      marginBottom: 4,
    },
    hr: {
      height: 1,
      backgroundColor: brand.colors.border,
      marginVertical: 10,
    },
    imageWrap: {
      marginVertical: 8,
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 6,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: 260,
      objectFit: "cover",
    } as any,
    imageCaption: {
      padding: 8,
      fontSize: 8,
      color: brand.colors.muted,
    },
    empty: {
      fontSize: 9,
      color: brand.colors.muted,
      fontStyle: "italic",
    },
    strictBody: {
      fontSize: 9,
      color: brand.colors.text,
      lineHeight: 1.5,
      whiteSpace: "pre-wrap",
    } as any,
    orderedItem: {
      flexDirection: "row",
      marginBottom: 4,
    },
    orderedIndex: {
      fontSize: 9,
      color: brand.colors.secondary,
      marginRight: 6,
      width: 16,
      textAlign: "right",
    },
    orderedText: {
      fontSize: 9,
      color: brand.colors.text,
      flex: 1,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 8,
    },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Header brand={brand} documentTitle={title} documentRef={reference || undefined} />

        <Section brand={brand} number={1} title="Contenu">
          {data?.createdAt ? (
            <View style={styles.meta}>
              <Text style={styles.metaLine}>Créé: {new Date(data.createdAt).toLocaleString("fr-FR")}</Text>
            </View>
          ) : null}

          {layout?.summary ? <Callout brand={brand} type="info">{layout.summary}</Callout> : null}

          {Array.isArray(layout?.keyFacts) && layout.keyFacts.length > 0 ? (
            <DataTable
              brand={brand}
              title="Faits clés"
              rows={layout.keyFacts.map((r) => ({ label: r.label, value: r.value }))}
            />
          ) : null}

          {Array.isArray(layout?.keyPoints) && layout.keyPoints.length > 0 ? (
            <TwoColumn
              brand={brand}
              left={
                <InfoBox brand={brand} title="Points clés">
                  <BulletList brand={brand} items={layout.keyPoints.filter(Boolean).slice(0, Math.ceil(layout.keyPoints.length / 2))} />
                </InfoBox>
              }
              right={
                <InfoBox brand={brand} title=" ">
                  <BulletList brand={brand} items={layout.keyPoints.filter(Boolean).slice(Math.ceil(layout.keyPoints.length / 2))} />
                </InfoBox>
              }
            />
          ) : null}

          {mode === "strict" ? (
            body.trim() ? <Text style={styles.strictBody}>{body}</Text> : <Text style={styles.empty}>Aucun texte.</Text>
          ) : !blocks.length ? (
            <Text style={styles.empty}>Aucun texte.</Text>
          ) : (
            <>
              {blocks.map((b, i) => {
                if (b.kind === "h1") return <Text key={i} style={styles.h1}>{b.text}</Text>
                if (b.kind === "h2") return <Text key={i} style={styles.h2}>{b.text}</Text>
                if (b.kind === "h3") return <Text key={i} style={styles.h3}>{b.text}</Text>
                if (b.kind === "hr") return <View key={i} style={styles.hr} />
                if (b.kind === "p") return <Paragraph key={i} brand={brand}>{b.text}</Paragraph>
                if (b.kind === "ul") return <BulletList key={i} brand={brand} items={b.items.filter(Boolean)} />
                if (b.kind === "ol") {
                  return (
                    <View key={i} style={{ marginBottom: 8 }}>
                      {b.items.filter(Boolean).map((item, idx) => (
                        <View key={idx} style={styles.orderedItem}>
                          <Text style={styles.orderedIndex}>{idx + 1}.</Text>
                          <Text style={styles.orderedText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )
                }
                if (b.kind === "img") {
                  const isWebp = b.url.toLowerCase().includes(".webp")
                  return (
                    <View key={i} style={{ marginBottom: 10 }} wrap={false}>
                      {isWebp ? (
                        <Callout brand={brand} type="warning">
                          Image WEBP détectée: certains rendus PDF peuvent échouer. Préférez un lien PNG/JPG.
                        </Callout>
                      ) : null}
                      <View style={styles.imageWrap}>
                        <Image src={b.url} style={styles.image} />
                        {b.caption ? <Text style={styles.imageCaption}>{b.caption}</Text> : null}
                      </View>
                    </View>
                  )
                }
                if (b.kind === "asset") {
                  const asset = assetMap.get(b.key)
                  if (!asset) {
                    return (
                      <View key={i} style={{ marginBottom: 8 }} wrap={false}>
                        <Callout brand={brand} type="warning">
                          Image introuvable pour la clé: {b.key}
                        </Callout>
                      </View>
                    )
                  }
                  const isWebp = asset.url.toLowerCase().includes(".webp")
                  return (
                    <View key={i} style={{ marginBottom: 10 }} wrap={false}>
                      {isWebp ? (
                        <Callout brand={brand} type="warning">
                          Image WEBP détectée: certains rendus PDF peuvent échouer. Préférez un lien PNG/JPG.
                        </Callout>
                      ) : null}
                      <View style={styles.imageWrap}>
                        <Image src={asset.url} style={styles.image} />
                        <Text style={styles.imageCaption}>{asset.caption?.trim() || b.key}</Text>
                      </View>
                    </View>
                  )
                }
                return null
              })}
            </>
          )}
        </Section>

        {mode === "format" ? (
          <Section brand={brand} number="A" title="Texte intégral">
            {rawBody.trim() ? <Text style={styles.strictBody}>{rawBody}</Text> : <Text style={styles.empty}>Aucun texte.</Text>}
          </Section>
        ) : null}

        {sections.map((s, idx) => {
          const sectionNumber = idx + 2
          const bullets = Array.isArray(s.bullets) ? s.bullets : []
          const numbered = Array.isArray(s.numbered) ? s.numbered : []
          const imageUrls = Array.isArray(s.imageUrls) ? s.imageUrls : []
          const images = Array.isArray((s as any).images) ? ((s as any).images as Array<any>) : []
          const imageKeys = Array.isArray((s as any).imageKeys) ? ((s as any).imageKeys as Array<any>) : []

          return (
            <Section key={idx} brand={brand} number={sectionNumber} title={s.title}>
              {s.body ? <Paragraph brand={brand}>{normalizeText(s.body)}</Paragraph> : null}
              {bullets.length ? <BulletList brand={brand} items={bullets.filter(Boolean)} /> : null}
              {numbered.length ? (
                <View style={{ marginBottom: 8 }}>
                  {numbered.filter(Boolean).map((item, n) => (
                    <View key={n} style={styles.orderedItem}>
                      <Text style={styles.orderedIndex}>{n + 1}.</Text>
                      <Text style={styles.orderedText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {imageKeys.length ? (
                <>
                  {imageKeys
                    .filter((k) => typeof k === "string" && k.trim())
                    .map((k, u) => {
                      const key = String(k).trim()
                      const asset = assetMap.get(key)
                      if (!asset?.url) return null
                      const isWebp = asset.url.toLowerCase().includes(".webp")
                      return (
                        <View key={`${key}-${u}`} style={{ marginBottom: 10 }} wrap={false}>
                          {isWebp ? (
                            <Callout brand={brand} type="warning">
                              Image WEBP détectée: certains rendus PDF peuvent échouer. Préférez un lien PNG/JPG.
                            </Callout>
                          ) : null}
                          <View style={styles.imageWrap}>
                            <Image src={asset.url} style={styles.image} />
                            <Text style={styles.imageCaption}>{asset.caption?.trim() || key}</Text>
                          </View>
                        </View>
                      )
                    })}
                </>
              ) : null}
              {images.length ? (
                <>
                  {images.map((img, u) => {
                    const url = typeof img?.url === "string" ? img.url : ""
                    const caption = typeof img?.caption === "string" ? img.caption : null
                    if (!url) return null
                    const isWebp = url.toLowerCase().includes(".webp")
                    return (
                      <View key={u} style={{ marginBottom: 10 }} wrap={false}>
                        {isWebp ? (
                          <Callout brand={brand} type="warning">
                            Image WEBP détectée: certains rendus PDF peuvent échouer. Préférez un lien PNG/JPG.
                          </Callout>
                        ) : null}
                        <View style={styles.imageWrap}>
                          <Image src={url} style={styles.image} />
                          <Text style={styles.imageCaption}>{caption?.trim() || `Photo ${u + 1}`}</Text>
                        </View>
                      </View>
                    )
                  })}
                </>
              ) : imageUrls.length ? (
                <>
                  {imageUrls.map((url, u) => {
                    const isWebp = url.toLowerCase().includes(".webp")
                    return (
                      <View key={u} style={{ marginBottom: 10 }} wrap={false}>
                        {isWebp ? (
                          <Callout brand={brand} type="warning">
                            Image WEBP détectée: certains rendus PDF peuvent échouer. Préférez un lien PNG/JPG.
                          </Callout>
                        ) : null}
                        <View style={styles.imageWrap}>
                          <Image src={url} style={styles.image} />
                        </View>
                      </View>
                    )
                  })}
                </>
              ) : null}
            </Section>
          )
        })}

        <Footer brand={brand} />
      </Page>
    </Document>
  )
}
