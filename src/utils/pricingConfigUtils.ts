import {
  PricingConfig,
  ServiceType,
} from '../services/apis/pricingConfigService';

type PricingDefaults = {
  deliveryFeeActual: number;
  deliveryFeeExpected: number;
  platformFeeActual: number;
  platformFeeExpected: number;
  packagingChargesActual: number;
  packagingChargesExpected: number;
  commissionRate: number;
  gstRate: number;
};

const DEFAULT_PRICING_BY_TYPE: Record<ServiceType, PricingDefaults> = {
  FOOD: {
    deliveryFeeActual: 20,
    deliveryFeeExpected: 39,
    platformFeeActual: 5,
    platformFeeExpected: 12,
    packagingChargesActual: 0,
    packagingChargesExpected: 8,
    commissionRate: 0.1,
    gstRate: 0.18,
  },
  GROCERY: {
    deliveryFeeActual: 17,
    deliveryFeeExpected: 39,
    platformFeeActual: 3,
    platformFeeExpected: 12,
    packagingChargesActual: 0,
    packagingChargesExpected: 4,
    commissionRate: 0.02,
    gstRate: 0.18,
  },
};

const normalizePercentToRate = (
  value: number | undefined,
  fallback: number,
) => {
  if (value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return value > 1 ? value / 100 : value;
};

const findConfigByCandidates = (
  configs: PricingConfig[],
  candidates: string[],
  serviceType: ServiceType,
) => {
  const normalizedCandidates = candidates.map(candidate =>
    candidate.toUpperCase(),
  );

  return configs.find(config => {
    const key = String(config.configKey || '').toUpperCase();
    const configServiceType = String(config.serviceType || '').toUpperCase();

    return (
      normalizedCandidates.includes(key) && configServiceType === serviceType
    );
  });
};

export const getServiceTypeFromCategory = (category?: string): ServiceType => {
  const normalizedCategory = String(category || '').toLowerCase();
  return normalizedCategory.includes('grocery') ? 'GROCERY' : 'FOOD';
};

export const resolvePricingForService = (
  configs: PricingConfig[],
  serviceType: ServiceType,
): PricingDefaults => {
  const defaults = DEFAULT_PRICING_BY_TYPE[serviceType];

  const deliveryConfig = findConfigByCandidates(
    configs,
    ['DELIVERY_CHARGE', 'DELIVERY_FEE'],
    serviceType,
  );
  const platformConfig = findConfigByCandidates(
    configs,
    ['PLATFORM_FEE'],
    serviceType,
  );
  const packagingConfig = findConfigByCandidates(
    configs,
    ['PACKAGING_CHARGE', 'PACKAGING_FEE'],
    serviceType,
  );
  const commissionConfig = findConfigByCandidates(
    configs,
    ['COMMISSION', 'COMMISSION_PERCENT'],
    serviceType,
  );
  const taxConfig = findConfigByCandidates(
    configs,
    ['SERVICE_TAX', 'GST', 'GST_PERCENT'],
    serviceType,
  );

  return {
    deliveryFeeActual: Number(
      deliveryConfig?.actualValue ?? defaults.deliveryFeeActual,
    ),
    deliveryFeeExpected: Number(
      deliveryConfig?.expectedValue ?? defaults.deliveryFeeExpected,
    ),
    platformFeeActual: Number(
      platformConfig?.actualValue ?? defaults.platformFeeActual,
    ),
    platformFeeExpected: Number(
      platformConfig?.expectedValue ?? defaults.platformFeeExpected,
    ),
    packagingChargesActual: Number(
      packagingConfig?.actualValue ?? defaults.packagingChargesActual,
    ),
    packagingChargesExpected: Number(
      packagingConfig?.expectedValue ?? defaults.packagingChargesExpected,
    ),
    commissionRate: normalizePercentToRate(
      Number(commissionConfig?.actualValue),
      defaults.commissionRate,
    ),
    gstRate: normalizePercentToRate(
      Number(taxConfig?.actualValue),
      defaults.gstRate,
    ),
  };
};
