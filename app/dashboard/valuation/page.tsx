"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usePdfGeneration } from "@/hooks/usePdfGeneration"
import type { ValuationReportData } from "@/lib/pdf-generator"
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Home,
  MapPin,
  Zap,
  Calendar,
  Ruler,
  BedDouble,
  Bath,
  Car,
  Trees as Tree,
  Info,
  ChevronDown,
  BarChart3,
  Sparkles,
  Eye,
  Download,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Luxembourg market data Q1 2025 (source: Observatoire de l'Habitat)
const MARKET_DATA = {
  regions: {
    luxembourg_city: {
      name: "Luxembourg City",
      basePrice: 12106,
      trend: -6.4,
      districts: {
        belair: { name: "Belair", price: 14489, premium: 1.2 },
        gasperich: { name: "Gasperich", price: 12787, premium: 1.06 },
        kirchberg: { name: "Kirchberg", price: 12542, premium: 1.04 },
        limpertsberg: { name: "Limpertsberg", price: 12500, premium: 1.03 },
        merl: { name: "Merl", price: 12200, premium: 1.01 },
        bonnevoie: { name: "Bonnevoie", price: 11500, premium: 0.95 },
        hollerich: { name: "Hollerich", price: 11200, premium: 0.93 },
        hamm: { name: "Hamm", price: 9760, premium: 0.81 },
        beggen: { name: "Beggen", price: 9124, premium: 0.75 },
        other: { name: "Other districts", price: 11500, premium: 0.95 },
      },
    },
    centre: { name: "Centre (excl. City)", basePrice: 10719, trend: -3.2 },
    west: { name: "West", basePrice: 7661, trend: -2.1 },
    south: { name: "South", basePrice: 6944, trend: -1.8 },
    east: { name: "East", basePrice: 7102, trend: 0.8 },
    north: { name: "North", basePrice: 6104, trend: 5.2 },
  },
  energyClass: {
    A: { adjustment: 930, label: "A (Excellent)", color: "bg-green-500" },
    B: { adjustment: 650, label: "B (Very Good)", color: "bg-green-400" },
    C: { adjustment: 400, label: "C (Good)", color: "bg-lime-500" },
    D: { adjustment: 150, label: "D (Average)", color: "bg-yellow-500" },
    E: { adjustment: -100, label: "E (Below Average)", color: "bg-orange-400" },
    F: { adjustment: -400, label: "F (Poor)", color: "bg-orange-500" },
    G: { adjustment: -950, label: "G (Very Poor)", color: "bg-red-500" },
  },
  propertyType: {
    apartment: { multiplier: 1.0, label: "Apartment" },
    house: { multiplier: 1.08, label: "House" },
    studio: { multiplier: 1.05, label: "Studio" },
    penthouse: { multiplier: 1.25, label: "Penthouse" },
    duplex: { multiplier: 1.12, label: "Duplex" },
    townhouse: { multiplier: 1.06, label: "Townhouse" },
  },
  condition: {
    new: { adjustment: 1.15, label: "New (< 2 years)" },
    excellent: { adjustment: 1.08, label: "Excellent (renovated)" },
    good: { adjustment: 1.0, label: "Good" },
    average: { adjustment: 0.92, label: "Average (needs updates)" },
    poor: { adjustment: 0.8, label: "Poor (needs renovation)" },
  },
  depreciationRate: 0.003,
  maxDepreciation: 0.15,
}

const FEATURE_VALUES = {
  parking: { indoor: 45000, outdoor: 25000, none: 0 },
  garden: { private: 35000, shared: 10000, none: 0 },
  terrace: { large: 25000, small: 12000, none: 0 },
  balcony: { yes: 8000, no: 0 },
  elevator: { yes: 15000, no: 0 },
  cellar: { yes: 8000, no: 0 },
  view: { exceptional: 40000, good: 20000, standard: 0 },
  orientation: { south: 15000, east_west: 8000, north: -5000 },
  floor: { high: 12000, middle: 5000, ground: 0, basement: -15000 },
}

interface ValuationInputs {
  region: string
  district: string
  propertyType: string
  surface: number
  bedrooms: number
  bathrooms: number
  yearBuilt: number
  condition: string
  energyClass: string
  parking: string
  garden: string
  terrace: string
  balcony: string
  elevator: string
  cellar: string
  view: string
  orientation: string
  floor: string
}

const defaultInputs: ValuationInputs = {
  region: "luxembourg_city",
  district: "other",
  propertyType: "apartment",
  surface: 100,
  bedrooms: 2,
  bathrooms: 1,
  yearBuilt: 2015,
  condition: "good",
  energyClass: "C",
  parking: "indoor",
  garden: "none",
  terrace: "none",
  balcony: "yes",
  elevator: "yes",
  cellar: "yes",
  view: "standard",
  orientation: "east_west",
  floor: "middle",
}

export default function ValuationPage() {
  const [inputs, setInputs] = useState<ValuationInputs>(defaultInputs)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const { previewPdf, downloadPdf, isGenerating } = usePdfGeneration()

  const updateInput = <K extends keyof ValuationInputs>(key: K, value: ValuationInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const valuation = useMemo(() => {
    let basePricePerM2 = 0
    let regionName = ""
    let districtInfo = null

    if (inputs.region === "luxembourg_city") {
      const cityData = MARKET_DATA.regions.luxembourg_city
      regionName = cityData.name
      const district = cityData.districts[inputs.district as keyof typeof cityData.districts]
      if (district) {
        basePricePerM2 = district.price
        districtInfo = district
      } else {
        basePricePerM2 = cityData.basePrice
      }
    } else {
      const regionData = MARKET_DATA.regions[inputs.region as keyof typeof MARKET_DATA.regions]
      if (regionData && "basePrice" in regionData) {
        basePricePerM2 = regionData.basePrice
        regionName = regionData.name
      }
    }

    const energyData = MARKET_DATA.energyClass[inputs.energyClass as keyof typeof MARKET_DATA.energyClass]
    const energyAdjustedPrice = basePricePerM2 + (energyData?.adjustment || 0)

    const typeData = MARKET_DATA.propertyType[inputs.propertyType as keyof typeof MARKET_DATA.propertyType]
    const typeAdjustedPrice = energyAdjustedPrice * (typeData?.multiplier || 1)

    const conditionData = MARKET_DATA.condition[inputs.condition as keyof typeof MARKET_DATA.condition]
    const conditionAdjustedPrice = typeAdjustedPrice * (conditionData?.adjustment || 1)

    const currentYear = new Date().getFullYear()
    const age = Math.max(0, currentYear - inputs.yearBuilt)
    const depreciationYears = Math.max(0, age - 5)
    const depreciation = Math.min(depreciationYears * MARKET_DATA.depreciationRate, MARKET_DATA.maxDepreciation)
    const ageAdjustedPrice = conditionAdjustedPrice * (1 - depreciation)

    const baseValue = ageAdjustedPrice * inputs.surface

    const featureAdjustments = {
      parking: FEATURE_VALUES.parking[inputs.parking as keyof typeof FEATURE_VALUES.parking] || 0,
      garden: FEATURE_VALUES.garden[inputs.garden as keyof typeof FEATURE_VALUES.garden] || 0,
      terrace: FEATURE_VALUES.terrace[inputs.terrace as keyof typeof FEATURE_VALUES.terrace] || 0,
      balcony: FEATURE_VALUES.balcony[inputs.balcony as keyof typeof FEATURE_VALUES.balcony] || 0,
      elevator: FEATURE_VALUES.elevator[inputs.elevator as keyof typeof FEATURE_VALUES.elevator] || 0,
      cellar: FEATURE_VALUES.cellar[inputs.cellar as keyof typeof FEATURE_VALUES.cellar] || 0,
      view: FEATURE_VALUES.view[inputs.view as keyof typeof FEATURE_VALUES.view] || 0,
      orientation: FEATURE_VALUES.orientation[inputs.orientation as keyof typeof FEATURE_VALUES.orientation] || 0,
      floor: FEATURE_VALUES.floor[inputs.floor as keyof typeof FEATURE_VALUES.floor] || 0,
    }

    const totalFeatureValue = Object.values(featureAdjustments).reduce((a, b) => a + b, 0)

    const expectedBedrooms = Math.floor(inputs.surface / 25)
    const bedroomAdjustment = (inputs.bedrooms - expectedBedrooms) * 10000

    const estimatedValue = baseValue + totalFeatureValue + bedroomAdjustment

    const lowEstimate = estimatedValue * 0.92
    const highEstimate = estimatedValue * 1.08

    const finalPricePerM2 = estimatedValue / inputs.surface

    const regionTrend =
      inputs.region === "luxembourg_city"
        ? MARKET_DATA.regions.luxembourg_city.trend
        : (MARKET_DATA.regions[inputs.region as keyof typeof MARKET_DATA.regions] as { trend: number })?.trend || 0

    return {
      estimatedValue: Math.round(estimatedValue),
      lowEstimate: Math.round(lowEstimate),
      highEstimate: Math.round(highEstimate),
      pricePerM2: Math.round(finalPricePerM2),
      basePricePerM2: Math.round(basePricePerM2),
      regionName,
      districtInfo,
      breakdown: {
        baseValue: Math.round(baseValue),
        energyAdjustment: energyData?.adjustment * inputs.surface || 0,
        typeMultiplier: typeData?.multiplier || 1,
        conditionMultiplier: conditionData?.adjustment || 1,
        ageDepreciation: depreciation,
        featureAdjustments,
        totalFeatureValue,
        bedroomAdjustment,
      },
      regionTrend,
      energyClass: inputs.energyClass,
    }
  }, [inputs])

  const buildValuationReportData = (): ValuationReportData => {
    const now = new Date().toISOString()

    return {
      generatedAt: now,
      reportTitle: "Rapport d'Estimation",
      valuation: {
        estimatedValue: valuation.estimatedValue,
        lowEstimate: valuation.lowEstimate,
        highEstimate: valuation.highEstimate,
        pricePerM2: valuation.pricePerM2,
        basePricePerM2: valuation.basePricePerM2,
        regionName: valuation.regionName,
        districtName: valuation.districtInfo?.name || null,
        regionTrend: valuation.regionTrend,
        energyClass: valuation.energyClass,
      },
      inputs: {
        region: valuation.regionName,
        district:
          inputs.region === "luxembourg_city"
            ? valuation.districtInfo?.name || inputs.district
            : inputs.region,
        propertyType: inputs.propertyType,
        surface: inputs.surface,
        bedrooms: inputs.bedrooms,
        bathrooms: inputs.bathrooms,
        yearBuilt: inputs.yearBuilt,
        condition: inputs.condition,
        energyClass: inputs.energyClass,
        features: {
          parking: inputs.parking,
          garden: inputs.garden,
          terrace: inputs.terrace,
          balcony: inputs.balcony,
          elevator: inputs.elevator,
          cellar: inputs.cellar,
          view: inputs.view,
          orientation: inputs.orientation,
          floor: inputs.floor,
        },
      },
      breakdown: {
        baseValue: valuation.breakdown.baseValue,
        energyAdjustment: Math.round(valuation.breakdown.energyAdjustment),
        typeMultiplier: valuation.breakdown.typeMultiplier,
        conditionMultiplier: valuation.breakdown.conditionMultiplier,
        ageDepreciation: valuation.breakdown.ageDepreciation,
        featureAdjustments: valuation.breakdown.featureAdjustments,
        totalFeatureValue: valuation.breakdown.totalFeatureValue,
        bedroomAdjustment: valuation.breakdown.bedroomAdjustment,
      },
      disclaimers: [
        "Estimation indicative basée sur des références de marché et des ajustements simplifiés.",
        "Ne remplace pas une expertise immobilière ou une évaluation notariale.",
        "Les résultats varient selon l'état réel, les travaux, la copropriété, et les conditions de vente.",
      ],
    }
  }

  const handlePreviewReport = async () => {
    const data = buildValuationReportData()
    const filename = `valuation_report_${new Date().toISOString().slice(0, 10)}.pdf`
    await previewPdf({ documentType: "valuation_report", data: data as unknown as Record<string, unknown>, filename })
  }

  const handleDownloadReport = async () => {
    const data = buildValuationReportData()
    const filename = `valuation_report_${new Date().toISOString().slice(0, 10)}.pdf`
    await downloadPdf({ documentType: "valuation_report", data: data as unknown as Record<string, unknown>, filename })
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Estimation</h1>
            <p className="text-sm text-muted-foreground">Estimez la valeur d&apos;un bien (Luxembourg • Q1 2025)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-muted/30">
            <Sparkles className="mr-1 h-3 w-3" />
            Modèle simplifié
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-2 space-y-6">

        {/* Location Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={inputs.region} onValueChange={(v) => updateInput("region", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="luxembourg_city">Luxembourg City (12,106 EUR/m²)</SelectItem>
                  <SelectItem value="centre">Centre excl. City (10,719 EUR/m²)</SelectItem>
                  <SelectItem value="west">West (7,661 EUR/m²)</SelectItem>
                  <SelectItem value="east">East (7,102 EUR/m²)</SelectItem>
                  <SelectItem value="south">South (6,944 EUR/m²)</SelectItem>
                  <SelectItem value="north">North (6,104 EUR/m²)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inputs.region === "luxembourg_city" && (
              <div className="space-y-2">
                <Label>District</Label>
                <Select value={inputs.district} onValueChange={(v) => updateInput("district", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belair">Belair (14,489 EUR/m²)</SelectItem>
                    <SelectItem value="gasperich">Gasperich (12,787 EUR/m²)</SelectItem>
                    <SelectItem value="kirchberg">Kirchberg (12,542 EUR/m²)</SelectItem>
                    <SelectItem value="limpertsberg">Limpertsberg (12,500 EUR/m²)</SelectItem>
                    <SelectItem value="merl">Merl (12,200 EUR/m²)</SelectItem>
                    <SelectItem value="bonnevoie">Bonnevoie (11,500 EUR/m²)</SelectItem>
                    <SelectItem value="hollerich">Hollerich (11,200 EUR/m²)</SelectItem>
                    <SelectItem value="hamm">Hamm (9,760 EUR/m²)</SelectItem>
                    <SelectItem value="beggen">Beggen (9,124 EUR/m²)</SelectItem>
                    <SelectItem value="other">Other districts (11,500 EUR/m²)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Details Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4 text-primary" />
              Property Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={inputs.propertyType} onValueChange={(v) => updateInput("propertyType", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House (+8%)</SelectItem>
                  <SelectItem value="studio">Studio (+5%)</SelectItem>
                  <SelectItem value="penthouse">Penthouse (+25%)</SelectItem>
                  <SelectItem value="duplex">Duplex (+12%)</SelectItem>
                  <SelectItem value="townhouse">Townhouse (+6%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                Surface (m²)
              </Label>
              <Input
                type="number"
                value={inputs.surface}
                onChange={(e) => updateInput("surface", Number.parseInt(e.target.value) || 0)}
                min={20}
                max={1000}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5" />
                Bedrooms
              </Label>
              <Select
                value={inputs.bedrooms.toString()}
                onValueChange={(v) => updateInput("bedrooms", Number.parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Bath className="h-3.5 w-3.5" />
                Bathrooms
              </Label>
              <Select
                value={inputs.bathrooms.toString()}
                onValueChange={(v) => updateInput("bathrooms", Number.parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Year Built
              </Label>
              <Input
                type="number"
                value={inputs.yearBuilt}
                onChange={(e) => updateInput("yearBuilt", Number.parseInt(e.target.value) || 2000)}
                min={1900}
                max={2025}
              />
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={inputs.condition} onValueChange={(v) => updateInput("condition", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New (+15%)</SelectItem>
                  <SelectItem value="excellent">Excellent (+8%)</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average (-8%)</SelectItem>
                  <SelectItem value="poor">Poor (-20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Energy Class Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-primary" />
              Energy Performance
            </CardTitle>
            <CardDescription className="text-xs">Up to 2,000 EUR/m² difference between classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MARKET_DATA.energyClass).map(([key, data]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateInput("energyClass", key)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all ${
                    inputs.energyClass === key
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full ${data.color} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{key}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {data.adjustment > 0 ? "+" : ""}
                    {data.adjustment}/m²
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features Section - Collapsible */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Additional Features
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5" />
                    Parking
                  </Label>
                  <Select value={inputs.parking} onValueChange={(v) => updateInput("parking", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indoor">Indoor (+45k)</SelectItem>
                      <SelectItem value="outdoor">Outdoor (+25k)</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Tree className="h-3.5 w-3.5" />
                    Garden
                  </Label>
                  <Select value={inputs.garden} onValueChange={(v) => updateInput("garden", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (+35k)</SelectItem>
                      <SelectItem value="shared">Shared (+10k)</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Terrace</Label>
                  <Select value={inputs.terrace} onValueChange={(v) => updateInput("terrace", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="large">Large (+25k)</SelectItem>
                      <SelectItem value="small">Small (+12k)</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Balcony</Label>
                  <Select value={inputs.balcony} onValueChange={(v) => updateInput("balcony", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes (+8k)</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Elevator</Label>
                  <Select value={inputs.elevator} onValueChange={(v) => updateInput("elevator", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes (+15k)</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cellar</Label>
                  <Select value={inputs.cellar} onValueChange={(v) => updateInput("cellar", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes (+8k)</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>View</Label>
                  <Select value={inputs.view} onValueChange={(v) => updateInput("view", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exceptional">Exceptional (+40k)</SelectItem>
                      <SelectItem value="good">Good (+20k)</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select value={inputs.orientation} onValueChange={(v) => updateInput("orientation", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="south">South (+15k)</SelectItem>
                      <SelectItem value="east_west">East/West (+8k)</SelectItem>
                      <SelectItem value="north">North (-5k)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Floor Level</Label>
                  <Select value={inputs.floor} onValueChange={(v) => updateInput("floor", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (+12k)</SelectItem>
                      <SelectItem value="middle">Middle (+5k)</SelectItem>
                      <SelectItem value="ground">Ground</SelectItem>
                      <SelectItem value="basement">Basement (-15k)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Market Context - Mobile only (desktop shows in sidebar) */}
        <Card className="lg:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Market Context Q1 2025
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">National Avg</p>
                <p className="font-semibold">8,373 EUR/m²</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Lux City</p>
                <p className="font-semibold">12,106 EUR/m²</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Right Column - Results (Sticky) */}
        <div className="space-y-6 lg:sticky lg:top-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
              Estimated Value
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Value */}
            <div className="text-center">
              <p className="text-4xl font-bold tracking-tight">
                {valuation.estimatedValue.toLocaleString("fr-LU")} EUR
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Range: {valuation.lowEstimate.toLocaleString("fr-LU")} -{" "}
                {valuation.highEstimate.toLocaleString("fr-LU")} EUR
              </p>
            </div>

            <Separator />

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-background p-3">
                <p className="text-xs text-muted-foreground">Price/m²</p>
                <p className="text-lg font-semibold">{valuation.pricePerM2.toLocaleString("fr-LU")}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">vs avg</span>
                  {valuation.pricePerM2 > valuation.basePricePerM2 ? (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs text-green-600">
                      +
                      {Math.round(((valuation.pricePerM2 - valuation.basePricePerM2) / valuation.basePricePerM2) * 100)}
                      %
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs text-orange-600">
                      {Math.round(((valuation.pricePerM2 - valuation.basePricePerM2) / valuation.basePricePerM2) * 100)}
                      %
                    </Badge>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-background p-3">
                <p className="text-xs text-muted-foreground">Market Trend</p>
                <div className="flex items-center gap-1">
                  {valuation.regionTrend >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-semibold text-green-600">+{valuation.regionTrend}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                      <span className="text-lg font-semibold text-orange-600">{valuation.regionTrend}%</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{valuation.regionName}</p>
              </div>
            </div>

            {/* Report actions */}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviewReport}
                disabled={isGenerating}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadReport}
                disabled={isGenerating}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>

            {/* Breakdown Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full text-xs"
            >
              {showBreakdown ? "Hide" : "Show"} Breakdown
              <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
            </Button>

            {showBreakdown && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-xs">
                <div className="flex justify-between">
                  <span>
                    Base ({inputs.surface}m² × {valuation.basePricePerM2})
                  </span>
                  <span>{(inputs.surface * valuation.basePricePerM2).toLocaleString("fr-LU")}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Energy {inputs.energyClass}</span>
                  <span>
                    {valuation.breakdown.energyAdjustment >= 0 ? "+" : ""}
                    {Math.round(valuation.breakdown.energyAdjustment).toLocaleString("fr-LU")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Type ({inputs.propertyType})</span>
                  <span>×{valuation.breakdown.typeMultiplier.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Condition</span>
                  <span>×{valuation.breakdown.conditionMultiplier.toFixed(2)}</span>
                </div>
                {valuation.breakdown.ageDepreciation > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Age ({new Date().getFullYear() - inputs.yearBuilt}y)</span>
                    <span>-{(valuation.breakdown.ageDepreciation * 100).toFixed(1)}%</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between">
                  <span>Features</span>
                  <span className="text-green-600">
                    +{valuation.breakdown.totalFeatureValue.toLocaleString("fr-LU")}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{valuation.estimatedValue.toLocaleString("fr-LU")} EUR</span>
                </div>
              </div>
            )}

            {/* Market Context - Desktop only */}
            <div className="hidden space-y-2 lg:block">
              <Separator />
              <p className="flex items-center gap-1 text-xs font-medium">
                <BarChart3 className="h-3 w-3" />
                Market Context
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">National</p>
                  <p className="text-xs font-medium">8,373 EUR/m²</p>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">Most Expensive</p>
                  <p className="text-xs font-medium">Belair 14,489</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              <Info className="mr-0.5 inline h-3 w-3" />
              Based on Observatoire de l'Habitat Q1 2025 data. For informational purposes only.
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
