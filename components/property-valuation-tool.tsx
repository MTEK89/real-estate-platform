"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Home,
  Building2,
  MapPin,
  Zap,
  Calendar,
  Ruler,
  BedDouble,
  Bath,
  Car,
  Trees as Tree,
  Info,
  ChevronRight,
  BarChart3,
  Scale,
} from "lucide-react"

// Luxembourg market data Q1 2025 (source: Observatoire de l'Habitat)
const MARKET_DATA = {
  // Base prices per m² by region
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
  // Energy class price adjustments per m²
  energyClass: {
    A: { adjustment: 930, label: "A (Excellent)", color: "bg-green-500" },
    B: { adjustment: 650, label: "B (Very Good)", color: "bg-green-400" },
    C: { adjustment: 400, label: "C (Good)", color: "bg-lime-400" },
    D: { adjustment: 150, label: "D (Average)", color: "bg-yellow-400" },
    E: { adjustment: -100, label: "E (Below Average)", color: "bg-orange-400" },
    F: { adjustment: -400, label: "F (Poor)", color: "bg-orange-500" },
    G: { adjustment: -950, label: "G (Very Poor)", color: "bg-red-500" },
  },
  // Property type multipliers
  propertyType: {
    apartment: { multiplier: 1.0, label: "Apartment" },
    house: { multiplier: 1.08, label: "House" },
    studio: { multiplier: 1.05, label: "Studio" },
    penthouse: { multiplier: 1.25, label: "Penthouse" },
    duplex: { multiplier: 1.12, label: "Duplex" },
    townhouse: { multiplier: 1.06, label: "Townhouse" },
  },
  // Age/condition adjustments
  condition: {
    new: { adjustment: 1.15, label: "New (< 2 years)" },
    excellent: { adjustment: 1.08, label: "Excellent (renovated)" },
    good: { adjustment: 1.0, label: "Good" },
    average: { adjustment: 0.92, label: "Average (needs updates)" },
    poor: { adjustment: 0.8, label: "Poor (needs renovation)" },
  },
  // Year built depreciation (per year over 30 years)
  depreciationRate: 0.003, // 0.3% per year
  maxDepreciation: 0.15, // Max 15% depreciation
}

// Feature adjustments (absolute values in EUR)
const FEATURE_VALUES = {
  parking: { indoor: 45000, outdoor: 25000, none: 0 },
  garden: { private: 35000, shared: 10000, none: 0 },
  terrace: { large: 25000, small: 12000, none: 0 },
  balcony: { yes: 8000, no: 0 },
  elevator: { yes: 15000, no: 0 },
  cellar: { yes: 8000, no: 0 },
  attic: { yes: 12000, no: 0 },
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

export function PropertyValuationTool() {
  const [inputs, setInputs] = useState<ValuationInputs>(defaultInputs)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const updateInput = <K extends keyof ValuationInputs>(key: K, value: ValuationInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  // Main valuation calculation
  const valuation = useMemo(() => {
    // Step 1: Get base price per m² for region
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

    // Step 2: Apply energy class adjustment
    const energyData = MARKET_DATA.energyClass[inputs.energyClass as keyof typeof MARKET_DATA.energyClass]
    const energyAdjustedPrice = basePricePerM2 + (energyData?.adjustment || 0)

    // Step 3: Apply property type multiplier
    const typeData = MARKET_DATA.propertyType[inputs.propertyType as keyof typeof MARKET_DATA.propertyType]
    const typeAdjustedPrice = energyAdjustedPrice * (typeData?.multiplier || 1)

    // Step 4: Apply condition adjustment
    const conditionData = MARKET_DATA.condition[inputs.condition as keyof typeof MARKET_DATA.condition]
    const conditionAdjustedPrice = typeAdjustedPrice * (conditionData?.adjustment || 1)

    // Step 5: Apply age depreciation
    const currentYear = new Date().getFullYear()
    const age = Math.max(0, currentYear - inputs.yearBuilt)
    const depreciationYears = Math.max(0, age - 5) // No depreciation for first 5 years
    const depreciation = Math.min(depreciationYears * MARKET_DATA.depreciationRate, MARKET_DATA.maxDepreciation)
    const ageAdjustedPrice = conditionAdjustedPrice * (1 - depreciation)

    // Step 6: Calculate base value (price per m² × surface)
    const baseValue = ageAdjustedPrice * inputs.surface

    // Step 7: Add feature values
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

    // Step 8: Room count adjustment (bedrooms/bathrooms ratio)
    const expectedBedrooms = Math.floor(inputs.surface / 25) // ~25m² per bedroom rule
    const bedroomAdjustment = (inputs.bedrooms - expectedBedrooms) * 10000

    // Final calculation
    const estimatedValue = baseValue + totalFeatureValue + bedroomAdjustment

    // Calculate confidence range (±8%)
    const lowEstimate = estimatedValue * 0.92
    const highEstimate = estimatedValue * 1.08

    // Price per m² final
    const finalPricePerM2 = estimatedValue / inputs.surface

    // Market comparison
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

  return (
    <div className="space-y-6">
      {/* Results Card - Always visible at top */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Estimated Property Value
          </CardTitle>
          <CardDescription>Based on Q1 2025 Luxembourg market data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main estimate */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Market Value Estimate</p>
              <p className="text-4xl font-bold tracking-tight">
                {valuation.estimatedValue.toLocaleString("fr-LU")} EUR
              </p>
              <p className="text-sm text-muted-foreground">
                Range: {valuation.lowEstimate.toLocaleString("fr-LU")} -{" "}
                {valuation.highEstimate.toLocaleString("fr-LU")} EUR
              </p>
            </div>

            {/* Price per m² */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Price per m²</p>
              <p className="text-2xl font-semibold">{valuation.pricePerM2.toLocaleString("fr-LU")} EUR/m²</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Region avg:</span>
                <span className="text-sm font-medium">{valuation.basePricePerM2.toLocaleString("fr-LU")} EUR/m²</span>
                {valuation.pricePerM2 > valuation.basePricePerM2 ? (
                  <Badge variant="secondary" className="text-green-600">
                    +{Math.round(((valuation.pricePerM2 - valuation.basePricePerM2) / valuation.basePricePerM2) * 100)}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-orange-600">
                    {Math.round(((valuation.pricePerM2 - valuation.basePricePerM2) / valuation.basePricePerM2) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Market trend */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Market Trend (YoY)</p>
              <div className="flex items-center gap-2">
                {valuation.regionTrend >= 0 ? (
                  <>
                    <TrendingUp className="h-6 w-6 text-green-500" />
                    <span className="text-2xl font-semibold text-green-600">+{valuation.regionTrend}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-6 w-6 text-orange-500" />
                    <span className="text-2xl font-semibold text-orange-600">{valuation.regionTrend}%</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{valuation.regionName}</p>
            </div>
          </div>

          {/* Breakdown toggle */}
          <Separator className="my-4" />
          <Button variant="ghost" size="sm" onClick={() => setShowBreakdown(!showBreakdown)} className="w-full">
            {showBreakdown ? "Hide" : "Show"} Valuation Breakdown
            <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${showBreakdown ? "rotate-90" : ""}`} />
          </Button>

          {showBreakdown && (
            <div className="mt-4 space-y-3 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span>
                  Base value ({inputs.surface}m² × {valuation.basePricePerM2} EUR)
                </span>
                <span className="font-medium">
                  {(inputs.surface * valuation.basePricePerM2).toLocaleString("fr-LU")} EUR
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Energy class {inputs.energyClass} adjustment</span>
                <span>
                  {valuation.breakdown.energyAdjustment >= 0 ? "+" : ""}
                  {Math.round(valuation.breakdown.energyAdjustment).toLocaleString("fr-LU")} EUR
                </span>
              </div>
              <div className="flex justify-between">
                <span>Property type multiplier ({inputs.propertyType})</span>
                <span>×{valuation.breakdown.typeMultiplier.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Condition adjustment ({inputs.condition})</span>
                <span>×{valuation.breakdown.conditionMultiplier.toFixed(2)}</span>
              </div>
              {valuation.breakdown.ageDepreciation > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Age depreciation ({new Date().getFullYear() - inputs.yearBuilt} years)</span>
                  <span>-{(valuation.breakdown.ageDepreciation * 100).toFixed(1)}%</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Subtotal (surface-based)</span>
                <span>{valuation.breakdown.baseValue.toLocaleString("fr-LU")} EUR</span>
              </div>
              <Separator />
              <p className="font-medium">Feature Adjustments:</p>
              {Object.entries(valuation.breakdown.featureAdjustments).map(
                ([key, value]) =>
                  value !== 0 && (
                    <div key={key} className="flex justify-between pl-4">
                      <span className="capitalize">{key.replace("_", " ")}</span>
                      <span className={value > 0 ? "text-green-600" : "text-orange-600"}>
                        {value > 0 ? "+" : ""}
                        {value.toLocaleString("fr-LU")} EUR
                      </span>
                    </div>
                  ),
              )}
              {valuation.breakdown.bedroomAdjustment !== 0 && (
                <div className="flex justify-between pl-4">
                  <span>Bedroom count adjustment</span>
                  <span className={valuation.breakdown.bedroomAdjustment > 0 ? "text-green-600" : "text-orange-600"}>
                    {valuation.breakdown.bedroomAdjustment > 0 ? "+" : ""}
                    {valuation.breakdown.bedroomAdjustment.toLocaleString("fr-LU")} EUR
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Estimated Value</span>
                <span>{valuation.estimatedValue.toLocaleString("fr-LU")} EUR</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input Form */}
      <Tabs defaultValue="location" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="property" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Property
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="energy" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Energy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location Details</CardTitle>
              <CardDescription>Location is the primary driver of property value in Luxembourg</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={inputs.region} onValueChange={(v) => updateInput("region", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="luxembourg_city">Luxembourg City (avg. 12,106 EUR/m²)</SelectItem>
                    <SelectItem value="centre">Centre excl. City (avg. 10,719 EUR/m²)</SelectItem>
                    <SelectItem value="west">West (avg. 7,661 EUR/m²)</SelectItem>
                    <SelectItem value="east">East (avg. 7,102 EUR/m²)</SelectItem>
                    <SelectItem value="south">South (avg. 6,944 EUR/m²)</SelectItem>
                    <SelectItem value="north">North (avg. 6,104 EUR/m²)</SelectItem>
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
        </TabsContent>

        <TabsContent value="property" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Details</CardTitle>
              <CardDescription>Core characteristics of the property</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Property Type</Label>
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
                <Label className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Living Area (m²)
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
                <Label className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" />
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
                        {n} {n === 1 ? "bedroom" : "bedrooms"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bath className="h-4 w-4" />
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
                        {n} {n === 1 ? "bathroom" : "bathrooms"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
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
                    <SelectItem value="new">New (&lt; 2 years) +15%</SelectItem>
                    <SelectItem value="excellent">Excellent (renovated) +8%</SelectItem>
                    <SelectItem value="good">Good (standard)</SelectItem>
                    <SelectItem value="average">Average (needs updates) -8%</SelectItem>
                    <SelectItem value="poor">Poor (needs renovation) -20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Features</CardTitle>
              <CardDescription>Additional features that affect value</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Parking
                </Label>
                <Select value={inputs.parking} onValueChange={(v) => updateInput("parking", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor garage (+45,000 EUR)</SelectItem>
                    <SelectItem value="outdoor">Outdoor parking (+25,000 EUR)</SelectItem>
                    <SelectItem value="none">No parking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tree className="h-4 w-4" />
                  Garden
                </Label>
                <Select value={inputs.garden} onValueChange={(v) => updateInput("garden", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private garden (+35,000 EUR)</SelectItem>
                    <SelectItem value="shared">Shared garden (+10,000 EUR)</SelectItem>
                    <SelectItem value="none">No garden</SelectItem>
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
                    <SelectItem value="large">Large terrace (+25,000 EUR)</SelectItem>
                    <SelectItem value="small">Small terrace (+12,000 EUR)</SelectItem>
                    <SelectItem value="none">No terrace</SelectItem>
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
                    <SelectItem value="yes">Has balcony (+8,000 EUR)</SelectItem>
                    <SelectItem value="no">No balcony</SelectItem>
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
                    <SelectItem value="yes">Has elevator (+15,000 EUR)</SelectItem>
                    <SelectItem value="no">No elevator</SelectItem>
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
                    <SelectItem value="yes">Has cellar (+8,000 EUR)</SelectItem>
                    <SelectItem value="no">No cellar</SelectItem>
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
                    <SelectItem value="exceptional">Exceptional view (+40,000 EUR)</SelectItem>
                    <SelectItem value="good">Good view (+20,000 EUR)</SelectItem>
                    <SelectItem value="standard">Standard view</SelectItem>
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
                    <SelectItem value="south">South-facing (+15,000 EUR)</SelectItem>
                    <SelectItem value="east_west">East/West (+8,000 EUR)</SelectItem>
                    <SelectItem value="north">North-facing (-5,000 EUR)</SelectItem>
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
                    <SelectItem value="high">High floor (+12,000 EUR)</SelectItem>
                    <SelectItem value="middle">Middle floor (+5,000 EUR)</SelectItem>
                    <SelectItem value="ground">Ground floor</SelectItem>
                    <SelectItem value="basement">Basement (-15,000 EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="energy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Energy Performance</CardTitle>
              <CardDescription>
                Energy class has a significant impact on value (up to 2,000 EUR/m² difference)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Energy Performance Certificate (EPC)</Label>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(MARKET_DATA.energyClass).map(([key, data]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateInput("energyClass", key)}
                      className={`flex flex-col items-center rounded-lg border-2 p-3 transition-all ${
                        inputs.energyClass === key ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                      }`}
                    >
                      <div className={`mb-1 h-8 w-8 rounded-full ${data.color} flex items-center justify-center`}>
                        <span className="text-sm font-bold text-white">{key}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {data.adjustment > 0 ? "+" : ""}
                        {data.adjustment}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <Info className="mr-1 inline h-4 w-4" />
                  In Q1 2025, the price difference between class A and class G properties was 2,081 EUR/m² on average.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Market Context Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Luxembourg Market Context (Q1 2025)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">National Average</p>
              <p className="text-xl font-semibold">8,373 EUR/m²</p>
              <p className="text-xs text-orange-600">-5.1% YoY</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Luxembourg City</p>
              <p className="text-xl font-semibold">12,106 EUR/m²</p>
              <p className="text-xs text-orange-600">-6.4% YoY</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Most Expensive</p>
              <p className="text-xl font-semibold">Belair</p>
              <p className="text-xs text-muted-foreground">14,489 EUR/m²</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Best Growth</p>
              <p className="text-xl font-semibold">North Region</p>
              <p className="text-xs text-green-600">+5.2% YoY</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            <Scale className="mr-1 inline h-3 w-3" />
            Data source: Observatoire de l'Habitat Luxembourg, athome.lu Q1 2025 reports. This tool provides estimates
            for informational purposes only and should not replace a professional appraisal.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
