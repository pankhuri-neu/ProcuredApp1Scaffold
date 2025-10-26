/**
 * Enhanced Importer Dashboard Component - Stellar Version
 * 
 * Two tabs:
 * 1. My Purchases - Shows purchased instruments
 * 2. Create Trade - Create new trades in Escrow
 * 
 * Features:
 * - vLEI endorsed Purchase Order support with document storage
 * - Complete trade creation workflow
 * - Asset management and tracking
 * - Document upload and management
 * - Product type selection
 * - Comprehensive UI with all original features
 */
import React, { useState, useEffect } from 'react'
import { Layout } from "@stellar/design-system"

// ==================== INTERFACES ====================

interface TradeInstrument {
  instrumentId: bigint
  assetId: number
  blReference: string
  cargoDescription: string
  cargoValue: number
  status: string
  productType?: string
  seller?: string
  createdAt?: string
}

interface vLEIEndorsedPO {
  issuer: string
  holder: string
  endorsement: string
  timestamp: string
  documentHash: string
  signature?: string
  metadata?: any
}

interface EscrowTrade {
  tradeId: number
  buyer: string
  seller: string
  amount: bigint
  state: number
  productType: string
  description: string
  ipfsHash: string
  txId?: string
  explorerUrl?: string
}

// ==================== CONSTANTS ====================

const DEFAULT_SELLER_EXPORTER = 'GCEXAMPLESELLERADDRESS234567890ABCDEFGHIJKLMNOP'
const DEFAULT_SELLER_NAME = 'Jupiter Knitting Company'

const PRODUCT_TYPES = [
  { value: 'Textiles', label: 'Textiles', description: 'Cotton fabrics, synthetic materials, garments' },
  { value: 'Electronics', label: 'Electronics', description: 'Consumer electronics, semiconductors, components' },
  { value: 'Food-Tea', label: 'Food & Tea', description: 'Premium tea varieties, food products' },
  { value: 'Industrial', label: 'Industrial Equipment', description: 'Manufacturing machinery, tools' },
  { value: 'Raw Materials', label: 'Raw Materials', description: 'Base materials, chemicals, metals' },
  { value: 'Healthcare', label: 'Healthcare Products', description: 'Medical devices, pharmaceutical products' }
]

// ==================== UTILITIES ====================

const generateIPFSHash = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let hash = 'Qm'
  for (let i = 0; i < 44; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return hash
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatXLM = (stroops: number): string => {
  return (stroops / 10000000).toFixed(7) + ' XLM'
}

const usdToXLM = (usd: number, xlmPrice: number = 0.12): number => {
  return usd / xlmPrice
}

// Mock vLEI service
const mockVLEIService = {
  getEndorsedPO: async (): Promise<vLEIEndorsedPO> => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
      issuer: 'LEI:549300TESTISSUER001',
      holder: 'LEI:549300TESTHOLDER001',
      endorsement: 'VLEI_ENDORSEMENT_SIGNATURE_12345',
      timestamp: new Date().toISOString(),
      documentHash: 'sha256:' + generateIPFSHash(),
      signature: 'ED25519_SIGNATURE_MOCK_DATA',
      metadata: {
        poNumber: 'PO-2024-' + Math.floor(Math.random() * 10000),
        issueDate: new Date().toISOString().split('T')[0],
        amount: 100000,
        currency: 'USD'
      }
    }
  }
}

// ==================== MAIN COMPONENT ====================

export default function Importer() {
  const [currentTab, setCurrentTab] = useState<'purchases' | 'create-trade'>('create-trade')

  // Purchases state
  const [purchasedInstruments, setPurchasedInstruments] = useState<TradeInstrument[]>([])
  const [loading, setLoading] = useState(true)
  const [accountAssets, setAccountAssets] = useState<any[]>([])

  // Create trade state
  const [formData, setFormData] = useState({
    sellerName: DEFAULT_SELLER_NAME,
    sellerExporterAddress: DEFAULT_SELLER_EXPORTER,
    cargoDescription: 'Premium Tea Shipment',
    cargoValue: 100000,
    productType: 'Food-Tea',
    purchaseOrderFile: null as File | null,
    vLEIEndorsedPO: null as vLEIEndorsedPO | null
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [createdTradeId, setCreatedTradeId] = useState<number | null>(null)
  const [createdTxId, setCreatedTxId] = useState<string | null>(null)
  const [isLoadingVLEI, setIsLoadingVLEI] = useState(false)
  const [vLEILoaded, setVLEILoaded] = useState(false)
  const [isLoadingImporterVLEI, setIsLoadingImporterVLEI] = useState(false)
  const [importerVLEIData, setImporterVLEIData] = useState<string>('')
  const [isLoadingSellerVLEI, setIsLoadingSellerVLEI] = useState(false)
  const [sellerVLEIData, setSellerVLEIData] = useState<string>('')

  // Opt-in state
  const [optInAssetId, setOptInAssetId] = useState('')
  const [isOptingIn, setIsOptingIn] = useState(false)
  const [optInSuccess, setOptInSuccess] = useState('')
  const [optInError, setOptInError] = useState('')

  // ==================== EFFECTS ====================

  useEffect(() => {
    loadMockData()
  }, [])

  useEffect(() => {
    // Update description based on product type
    const selectedProduct = PRODUCT_TYPES.find(p => p.value === formData.productType)
    if (selectedProduct && !formData.cargoDescription.includes('Custom')) {
      setFormData(prev => ({
        ...prev,
        cargoDescription: selectedProduct.description.split(',')[0] + ' Shipment'
      }))
    }
  }, [formData.productType])

  // ==================== DATA LOADING ====================

  const loadMockData = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockPurchases: TradeInstrument[] = [
      {
        instrumentId: BigInt(2001),
        assetId: 2001,
        blReference: 'BL-2024-050',
        cargoDescription: 'Premium Cotton Textiles - 1000 units',
        cargoValue: 250000,
        status: 'OWNED',
        productType: 'Textiles',
        seller: 'Jupiter Knitting Company',
        createdAt: '2024-10-15'
      },
      {
        instrumentId: BigInt(2002),
        assetId: 2002,
        blReference: 'BL-2024-051',
        cargoDescription: 'Industrial Machinery Components',
        cargoValue: 180000,
        status: 'OWNED',
        productType: 'Industrial',
        seller: 'Global Manufacturing Ltd',
        createdAt: '2024-10-18'
      },
      {
        instrumentId: BigInt(2003),
        assetId: 2003,
        blReference: 'BL-2024-052',
        cargoDescription: 'Premium Tea Varieties - 500kg',
        cargoValue: 75000,
        status: 'OWNED',
        productType: 'Food-Tea',
        seller: 'Ceylon Tea Exporters',
        createdAt: '2024-10-20'
      }
    ]

    setPurchasedInstruments(mockPurchases)
    setLoading(false)
  }

  // ==================== HANDLERS ====================

  const handleProductTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, productType: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/json') {
        setFormData(prev => ({ ...prev, purchaseOrderFile: file }))
        setUploadedFileName(file.name)
        setError('')

        // Try to parse and load the JSON
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string)
            setFormData(prev => ({ ...prev, vLEIEndorsedPO: json }))
            setVLEILoaded(true)
            setSuccess('✅ Purchase Order JSON loaded successfully!')
          } catch (err) {
            setError('❌ Invalid JSON file')
          }
        }
        reader.readAsText(file)
      } else {
        setError('❌ Please upload a JSON file')
      }
    }
  }

  const handleLoadVLEIPO = async () => {
    setIsLoadingVLEI(true)
    setError('')

    try {
      const endorsedPO = await mockVLEIService.getEndorsedPO()
      setFormData(prev => ({ ...prev, vLEIEndorsedPO: endorsedPO }))
      setVLEILoaded(true)
      setSuccess('✅ vLEI Purchase Order loaded successfully!')
    } catch (err) {
      setError('❌ Failed to load vLEI Purchase Order')
    } finally {
      setIsLoadingVLEI(false)
    }
  }

  const handleLoadImporterVLEI = async () => {
    setIsLoadingImporterVLEI(true)
    setError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockData = {
        lei: 'LEI:549300IMPORTER123',
        legalName: 'Global Import Trading Co.',
        jurisdiction: 'US-DE',
        status: 'ACTIVE',
        issuedAt: new Date().toISOString()
      }
      setImporterVLEIData(JSON.stringify(mockData, null, 2))
      setSuccess('✅ Importer vLEI credentials loaded!')
    } catch (err) {
      setError('❌ Failed to load Importer vLEI')
    } finally {
      setIsLoadingImporterVLEI(false)
    }
  }

  const handleLoadSellerVLEI = async () => {
    setIsLoadingSellerVLEI(true)
    setError('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockData = {
        lei: 'LEI:549300SELLER456',
        legalName: formData.sellerName,
        jurisdiction: 'IN-TN',
        status: 'ACTIVE',
        issuedAt: new Date().toISOString()
      }
      setSellerVLEIData(JSON.stringify(mockData, null, 2))
      setSuccess('✅ Seller/Exporter vLEI credentials loaded!')
    } catch (err) {
      setError('❌ Failed to load Seller vLEI')
    } finally {
      setIsLoadingSellerVLEI(false)
    }
  }

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.purchaseOrderFile && !formData.vLEIEndorsedPO) {
      setError('❌ Please upload a Purchase Order or load vLEI PO')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2500))

      const mockTradeId = Math.floor(Math.random() * 10000)
      const mockTxId = 'stellar:tx:' + generateIPFSHash().substring(0, 32)

      setCreatedTradeId(mockTradeId)
      setCreatedTxId(mockTxId)
      setSuccess('✅ Trade created successfully on Stellar blockchain!')

      // Reset form after success
      setTimeout(() => {
        resetForm()
      }, 3000)

    } catch (err) {
      setError('❌ Failed to create trade: ' + (err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      sellerName: DEFAULT_SELLER_NAME,
      sellerExporterAddress: DEFAULT_SELLER_EXPORTER,
      cargoDescription: 'Premium Tea Shipment',
      cargoValue: 100000,
      productType: 'Food-Tea',
      purchaseOrderFile: null,
      vLEIEndorsedPO: null
    })
    setUploadedFileName('')
    setVLEILoaded(false)
    setCreatedTradeId(null)
    setCreatedTxId(null)
    setImporterVLEIData('')
    setSellerVLEIData('')
  }

  const handleOptInToAsset = async () => {
    if (!optInAssetId) {
      setOptInError('Please enter an Asset ID')
      return
    }

    setIsOptingIn(true)
    setOptInError('')
    setOptInSuccess('')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setOptInSuccess('✅ Successfully opted-in to Asset ID: ' + optInAssetId)
      setOptInAssetId('')
    } catch (err) {
      setOptInError('❌ Failed to opt-in to asset')
    } finally {
      setIsOptingIn(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(''), 3000)
  }

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(''), 5000)
  }

  // ==================== RENDER ====================

  return (
    <Layout.Content>
      <Layout.Inset>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6">

            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🏪 Importer Dashboard Enhanced
              </h1>
              <p className="text-gray-600">
                Manage your trade finance operations on Stellar blockchain
              </p>
            </div>

            {/* Global Success/Error Messages */}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                {success}
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Transaction Success */}
            {createdTxId && (
              <div className="bg-blue-100 border border-blue-400 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-blue-900 mb-2">🎉 Trade Created Successfully!</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Trade ID:</strong> {createdTradeId}</p>
                  <p><strong>Transaction:</strong> <code className="bg-blue-200 px-2 py-1 rounded text-xs">{createdTxId}</code></p>
                  <p className="text-xs mt-2">✓ Your trade is now live on Stellar blockchain</p>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <nav className="flex space-x-8 px-6 border-b border-gray-200">
                <button
                  onClick={() => setCurrentTab('create-trade')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentTab === 'create-trade'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  ➕ Create Trade
                </button>
                <button
                  onClick={() => setCurrentTab('purchases')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentTab === 'purchases'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  📦 My Purchases ({purchasedInstruments.length})
                </button>
              </nav>
            </div>

            {/* MY PURCHASES TAB */}
            {currentTab === 'purchases' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    📦 My Purchased Instruments
                  </h2>
                  <button
                    onClick={loadMockData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {/* Opt-in Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">
                    🔓 Opt-in to Asset
                  </h3>
                  <p className="text-sm text-purple-700 mb-3">
                    Before receiving trade instruments, you must opt-in to the asset on Stellar
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={optInAssetId}
                      onChange={(e) => setOptInAssetId(e.target.value)}
                      placeholder="Enter Asset ID (e.g., 2001)"
                      className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleOptInToAsset}
                      disabled={isOptingIn || !optInAssetId}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {isOptingIn ? 'Opting-in...' : 'Opt-in'}
                    </button>
                  </div>

                  {optInSuccess && (
                    <div className="mt-2 text-sm text-green-700 bg-green-100 border border-green-300 rounded px-3 py-2">
                      {optInSuccess}
                    </div>
                  )}

                  {optInError && (
                    <div className="mt-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded px-3 py-2">
                      {optInError}
                    </div>
                  )}
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your purchases...</p>
                  </div>
                ) : purchasedInstruments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No purchases yet</h3>
                    <p className="text-gray-500 mb-4">
                      Start by creating a trade or purchasing from the marketplace
                    </p>
                    <button
                      onClick={() => setCurrentTab('create-trade')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Create Your First Trade
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchasedInstruments.map((instrument) => (
                      <div
                        key={instrument.assetId}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-gradient-to-r from-green-50 to-emerald-50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                {instrument.status}
                              </span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                {instrument.productType}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {instrument.cargoDescription}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>BL Reference:</strong> {instrument.blReference}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Seller:</strong> {instrument.seller || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created: {instrument.createdAt || 'N/A'}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-3xl font-bold text-green-600 mb-1">
                              {formatCurrency(instrument.cargoValue)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Asset ID: {instrument.assetId}
                            </p>
                            <p className="text-xs text-gray-500">
                              ~{formatXLM(instrument.cargoValue * 10000000)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            📄 View Details
                          </button>
                          <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                            📤 Transfer
                          </button>
                          <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                            🔍 View on Explorer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Stats */}
                {!loading && purchasedInstruments.length > 0 && (
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Portfolio Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Total Instruments</p>
                        <p className="text-2xl font-bold text-blue-900">{purchasedInstruments.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(purchasedInstruments.reduce((sum, i) => sum + i.cargoValue, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Product Types</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {new Set(purchasedInstruments.map(i => i.productType)).size}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CREATE TRADE TAB */}
            {currentTab === 'create-trade' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  ➕ Create New Trade in Escrow
                </h2>

                <form onSubmit={handleCreateTrade} className="space-y-6">

                  {/* Seller/Exporter Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <span className="mr-2">🏭</span> Seller/Exporter Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={formData.sellerName}
                          onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter seller/exporter company name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stellar Address *
                        </label>
                        <input
                          type="text"
                          value={formData.sellerExporterAddress}
                          onChange={(e) => setFormData({ ...formData, sellerExporterAddress: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                          placeholder="GXXXXXXXXX..."
                          required
                        />
                      </div>
                    </div>

                    {/* Load Seller vLEI Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleLoadSellerVLEI}
                        disabled={isLoadingSellerVLEI}
                        className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isLoadingSellerVLEI ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </span>
                        ) : (
                          '🔐 Load Seller vLEI'
                        )}
                      </button>
                    </div>

                    {/* Seller vLEI Data Display */}
                    {sellerVLEIData && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Seller vLEI Credentials
                        </label>
                        <textarea
                          value={sellerVLEIData}
                          readOnly
                          rows={6}
                          className="w-full px-3 py-2 border border-indigo-300 rounded-lg font-mono text-xs bg-indigo-50 text-gray-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Importer vLEI Section */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-5">
                    <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                      <span className="mr-2">🔐</span> Importer vLEI Credentials
                    </h3>
                    <p className="text-sm text-purple-700 mb-4">
                      Load your verifiable Legal Entity Identifier credentials to authenticate this trade
                    </p>

                    <button
                      type="button"
                      onClick={handleLoadImporterVLEI}
                      disabled={isLoadingImporterVLEI}
                      className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isLoadingImporterVLEI ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading...
                        </span>
                      ) : (
                        '🔐 Load Importer vLEI'
                      )}
                    </button>

                    {/* Importer vLEI Data Display */}
                    {importerVLEIData && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Your vLEI Credentials (JSON)
                        </label>
                        <textarea
                          value={importerVLEIData}
                          readOnly
                          rows={6}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg font-mono text-xs bg-purple-50 text-gray-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Type *
                    </label>
                    <select
                      value={formData.productType}
                      onChange={(e) => handleProductTypeChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label} - {type.description}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Select the type of goods being traded
                    </p>
                  </div>

                  {/* Cargo Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo Value (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.cargoValue}
                        onChange={(e) => setFormData({ ...formData, cargoValue: parseInt(e.target.value) || 0 })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="100000"
                        min="1"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Equivalent: ~{usdToXLM(formData.cargoValue).toFixed(2)} XLM (at $0.12/XLM)
                    </p>
                  </div>

                  {/* Cargo Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.cargoDescription}
                      onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Provide detailed description of the cargo..."
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Auto-filled based on product type. You can edit as needed.
                    </p>
                  </div>

                  {/* Purchase Order Upload with vLEI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Order *
                    </label>

                    {/* vLEI Status Badge */}
                    {vLEILoaded && (
                      <div className="mb-3 bg-green-50 border border-green-300 rounded-lg p-3">
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">✓</span>
                          <span className="text-sm font-medium text-green-800">vLEI Endorsement Loaded</span>
                          <span className="ml-auto text-xs text-green-600">Verified & Ready for Storage</span>
                        </div>
                      </div>
                    )}

                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="purchase-order-upload"
                      />
                      <label htmlFor="purchase-order-upload" className="cursor-pointer block">
                        <div className="text-gray-600 mb-2">
                          {uploadedFileName && !vLEILoaded ? (
                            <span className="text-green-600">📄 {uploadedFileName}</span>
                          ) : (
                            <span>📄 Upload Purchase Order JSON</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {uploadedFileName && !vLEILoaded ? 'Click to change file' : 'Click to select a JSON file'}
                        </div>
                      </label>
                    </div>

                    {/* Get vLEI PO Button */}
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadVLEIPO}
                        disabled={isLoadingVLEI}
                        className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isLoadingVLEI ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </span>
                        ) : (
                          '🔐 Get vLEI PO'
                        )}
                      </button>
                    </div>

                    {/* vLEI PO JSON Response - Editable */}
                    {vLEILoaded && formData.vLEIEndorsedPO && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          vLEI PO JSON Response (Editable)
                        </label>
                        <textarea
                          value={JSON.stringify(formData.vLEIEndorsedPO, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value)
                              setFormData({ ...formData, vLEIEndorsedPO: parsed })
                            } catch (err) {
                              // Allow typing invalid JSON
                            }
                          }}
                          rows={8}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg font-mono text-xs bg-white text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Purchase Order vLEI JSON data..."
                        />
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(formData.vLEIEndorsedPO, null, 2))
                              showSuccess('vLEI PO JSON copied to clipboard!')
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            📋 Copy to Clipboard
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-gray-500">
                      Upload a JSON file or click "Get vLEI PO" to load a vLEI-endorsed purchase order.
                      vLEI endorsements will be stored on-chain.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || (!formData.purchaseOrderFile && !formData.vLEIEndorsedPO)}
                      className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${isSubmitting || (!formData.purchaseOrderFile && !formData.vLEIEndorsedPO)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Creating Trade on Stellar Blockchain...
                        </span>
                      ) : (
                        '🚀 Create Trade in Escrow'
                      )}
                    </button>
                  </div>

                  {/* XLM Balance Warning */}
                  {(vLEILoaded || importerVLEIData || sellerVLEIData) && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                        💰 Important: XLM Balance Required
                      </h4>
                      <p className="text-xs text-yellow-800 mb-2">
                        Creating a trade with vLEI documents requires storing large JSON files on-chain.
                      </p>
                      <div className="bg-yellow-100 rounded p-2 text-xs font-mono text-yellow-900">
                        <div>• Trade Amount: {usdToXLM(formData.cargoValue).toFixed(2)} XLM</div>
                        <div>• Storage Cost: ~5-10 XLM (for vLEI documents)</div>
                        <div>• Transaction Fees: ~0.01 XLM</div>
                        <div className="border-t border-yellow-300 mt-1 pt-1 font-bold">
                          Total Required: ~{(usdToXLM(formData.cargoValue) + 10).toFixed(2)} XLM
                        </div>
                      </div>
                      <p className="text-xs text-yellow-800 mt-2">
                        ⚠️ Ensure your wallet has at least <strong>{(usdToXLM(formData.cargoValue) + 15).toFixed(0)} XLM</strong> before submitting.
                      </p>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      ℹ️ What happens next?
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>✓ Your trade will be created on the Stellar blockchain (State: CREATED)</li>
                      {vLEILoaded && (
                        <li className="text-purple-700 font-medium">
                          ✓ vLEI endorsement will be stored on-chain (~5-10 XLM)
                        </li>
                      )}
                      <li>✓ The trade will be visible in the marketplace for funding</li>
                      <li>✓ You or a Financier must fund the escrow to lock funds (State: ESCROWED)</li>
                      <li>✓ The seller/exporter will then fulfill the order and transfer the instrument</li>
                      <li>✓ Payment is released atomically when the instrument is transferred</li>
                      <li>✓ All actions and documents are recorded on the Stellar blockchain</li>
                    </ul>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </Layout.Inset>
    </Layout.Content>
  )
}
