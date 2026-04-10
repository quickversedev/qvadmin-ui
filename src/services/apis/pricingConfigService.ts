import {apiCall, createRequestWithHeaders} from './axios.config';

export type ServiceType = 'FOOD' | 'GROCERY';
export type ConfigKey =
  | 'PLATFORM_FEE'
  | 'DELIVERY_CHARGE'
  | 'DELIVERY_FEE'
  | 'PACKAGING_CHARGE'
  | 'PACKAGING_FEE'
  | 'SERVICE_TAX'
  | 'GST'
  | 'GST_PERCENT'
  | 'COMMISSION'
  | 'COMMISSION_PERCENT';

export interface PricingConfig {
  id?: string;
  serviceType: ServiceType;
  configKey: ConfigKey;
  actualValue: number;
  expectedValue: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingConfigResponse {
  response?: {
    pricingConfigs?: PricingConfig[];
  };
  error?: {
    code: string;
    message: string;
  };
}

const BASIC_AUTH_HEADER = 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx';

/**
 * Fetch pricing configurations by service type
 * GET /quickVerse/v3/pricing-configurations?serviceType=FOOD
 */
export const fetchPricingConfigurations = async (
  serviceType?: ServiceType,
): Promise<PricingConfig[]> => {
  const endpoint = serviceType
    ? `/quickVerse/v3/pricing-configurations?serviceType=${encodeURIComponent(
        serviceType,
      )}`
    : '/quickVerse/v3/pricing-configurations';

  const response = await apiCall<PricingConfig[]>(
    createRequestWithHeaders('get', endpoint, undefined, {
      Authorization: BASIC_AUTH_HEADER,
    }),
  );

  const pricingConfigs = response;
  if (!pricingConfigs) {
    console.warn('No pricing configurations found for:', serviceType);
    return [];
  }

  return pricingConfigs;
};

/**
 * Create or update pricing configuration
 * PUT /quickVerse/v3/pricing-configurations/{id}
 */
export const updatePricingConfiguration = async (
  id: string,
  config: Omit<PricingConfig, 'id' | 'createdAt' | 'updatedAt'>,
  authToken?: string,
): Promise<PricingConfig> => {
  if (!id) {
    throw new Error('Configuration ID is required');
  }

  const endpoint = `/quickVerse/v3/pricing-configurations/${encodeURIComponent(
    id,
  )}`;

  const response = await apiCall<PricingConfig>(
    createRequestWithHeaders('put', endpoint, config, {
      Authorization: BASIC_AUTH_HEADER,
      SessionKey: authToken || '',
    }),
  );

  const pricingConfig = response;
  if (!pricingConfig) {
    throw new Error('Pricing configuration update failed');
  }

  return pricingConfig;
};

/**
 * Create new pricing configuration
 * POST /quickVerse/v3/pricing-configurations
 */
export const createPricingConfiguration = async (
  config: Omit<PricingConfig, 'id' | 'createdAt' | 'updatedAt'>,
  authToken?: string,
): Promise<PricingConfig> => {
  const endpoint = `/quickVerse/v3/pricing-configurations`;

  const response = await apiCall<PricingConfig>(
    createRequestWithHeaders('post', endpoint, config, {
      Authorization: BASIC_AUTH_HEADER,
      SessionKey: authToken || '',
    }),
  );

  const pricingConfig = response;
  if (!pricingConfig) {
    throw new Error('Pricing configuration creation failed');
  }

  return pricingConfig;
};

export const pricingConfigService = {
  fetchPricingConfigurations,
  updatePricingConfiguration,
  createPricingConfiguration,
};
