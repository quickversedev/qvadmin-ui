import axiosInstance, {apiCall} from './axios.config';

export type DeliveryPartnerGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface DeliveryPartnerUploadFile {
  uri: string;
  type?: string | null;
  name?: string | null;
}

export interface DeliveryPartner {
  id?: string;
  dpId?: string;
  deliveryPartnerId?: string;
  name?: string;
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  gender?: DeliveryPartnerGender | string;
  profilePicture?: string;
  aadharCard?: string;
  drivingLicence?: string;
  rcDocument?: string;
  isDeleted?: boolean;
  isOnline?: boolean;
  onlineStatus?: boolean | string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lastLocationUpdatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryPartnerFilter {
  isDeleted?: boolean;
  Order?: 'asc' | 'desc' | string;
  order_by?: string;
  [key: string]: unknown;
}

export interface DeliveryPartnerPayload {
  name?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  gender?: DeliveryPartnerGender | string;
  profilePicture?: DeliveryPartnerUploadFile | null;
  aadharCard?: DeliveryPartnerUploadFile | null;
  drivingLicence?: DeliveryPartnerUploadFile | null;
  rcDocument?: DeliveryPartnerUploadFile | null;
}

const BASIC_AUTH_HEADER = 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx';

const DELIVERY_PARTNER_BASE_PATH = '/v1/delivery-partner/';

const buildHeaders = (sessionKey?: string, multipart = false) => {
  const headers: Record<string, string> = {
    Authorization: BASIC_AUTH_HEADER,
  };

  if (sessionKey) {
    headers.SessionKey = sessionKey;
  }

  if (multipart) {
    headers['Content-Type'] = 'multipart/form-data';
  }

  return headers;
};

const validateStatus = (status: number) => status >= 200 && status <= 302;

const normalizeDeliveryPartnersResponse = (
  response: unknown,
): DeliveryPartner[] => {
  if (Array.isArray(response)) {
    return response as DeliveryPartner[];
  }

  const payload = response as {
    response?:
      | DeliveryPartner[]
      | {
          partners?: DeliveryPartner[];
          deliveryPartners?: DeliveryPartner[];
          data?: DeliveryPartner[];
        };
    partners?: DeliveryPartner[];
    deliveryPartners?: DeliveryPartner[];
    data?: DeliveryPartner[];
  };

  if (Array.isArray(payload?.response)) {
    return payload.response;
  }

  if (Array.isArray(payload?.response?.partners)) {
    return payload.response.partners;
  }

  if (Array.isArray(payload?.response?.deliveryPartners)) {
    return payload.response.deliveryPartners;
  }

  if (Array.isArray(payload?.response?.data)) {
    return payload.response.data;
  }

  if (Array.isArray(payload?.partners)) {
    return payload.partners;
  }

  if (Array.isArray(payload?.deliveryPartners)) {
    return payload.deliveryPartners;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const buildFormData = (payload: DeliveryPartnerPayload) => {
  const formData = new FormData();

  const appendText = (key: string, value: unknown) => {
    if (value === undefined || value === null) {
      return;
    }

    const stringValue = String(value).trim();
    if (!stringValue) {
      return;
    }

    formData.append(key, stringValue);
  };

  const appendFile = (key: string, file?: DeliveryPartnerUploadFile | null) => {
    if (!file?.uri) {
      return;
    }

    const fileName = file.name || `${key}_${Date.now()}`;
    const mimeType = file.type || 'application/octet-stream';

    formData.append(key, {
      uri: file.uri,
      name: fileName,
      type: mimeType,
    } as any);
  };

  appendText('name', payload.name);
  appendText('mobileNumber', payload.mobileNumber);
  appendText('email', payload.email);
  appendText('address', payload.address);
  appendText('gender', payload.gender);
  appendFile('profilePicture', payload.profilePicture);
  appendFile('aadharCard', payload.aadharCard);
  appendFile('drivingLicence', payload.drivingLicence);
  appendFile('rcDocument', payload.rcDocument);

  return formData;
};

export const getDeliveryPartnerId = (partner: DeliveryPartner) =>
  partner.id || partner.dpId || partner.deliveryPartnerId;

export const getDeliveryPartnerName = (partner: DeliveryPartner) =>
  partner.name || partner.fullName || 'Unnamed Partner';

export const fetchDeliveryPartners = async (
  filter?: DeliveryPartnerFilter,
  sessionKey?: string,
): Promise<DeliveryPartner[]> => {
  const endpoint = filter
    ? `${DELIVERY_PARTNER_BASE_PATH}?filter=${encodeURIComponent(
        JSON.stringify(filter),
      )}`
    : DELIVERY_PARTNER_BASE_PATH;

  const response = await apiCall<DeliveryPartner[]>(
    axiosInstance.get(endpoint, {
      headers: buildHeaders(sessionKey),
      validateStatus,
    }),
  );

  return response;
};

export const fetchOnlineDeliveryPartners = async (
  sessionKey?: string,
): Promise<DeliveryPartner[]> => {
  const response = await apiCall<unknown>(
    axiosInstance.get(
      `${DELIVERY_PARTNER_BASE_PATH}getPartnersByOnlineStatus`,
      {
        headers: buildHeaders(sessionKey),
        validateStatus,
      },
    ),
  );
  console.log(response, 'Online Delivery Partners Response');

  return normalizeDeliveryPartnersResponse(response);
};

export const fetchDeliveryPartnerById = async (
  id: string,
  sessionKey?: string,
): Promise<DeliveryPartner> => {
  if (!id) {
    throw new Error('Delivery partner ID is required');
  }

  const response = await apiCall<DeliveryPartner>(
    axiosInstance.get(
      `${DELIVERY_PARTNER_BASE_PATH}${encodeURIComponent(id)}`,
      {
        headers: buildHeaders(sessionKey),
        validateStatus,
      },
    ),
  );

  return response;
};

export const createDeliveryPartner = async (
  payload: DeliveryPartnerPayload,
  sessionKey?: string,
): Promise<DeliveryPartner> => {
  const response = await apiCall<DeliveryPartner>(
    axiosInstance.post(DELIVERY_PARTNER_BASE_PATH, buildFormData(payload), {
      headers: buildHeaders(sessionKey, true),
      validateStatus,
    }),
  );

  return response;
};

export const updateDeliveryPartner = async (
  id: string,
  payload: DeliveryPartnerPayload,
  sessionKey?: string,
): Promise<DeliveryPartner> => {
  if (!id) {
    throw new Error('Delivery partner ID is required');
  }

  const response = await apiCall<DeliveryPartner>(
    axiosInstance.put(
      `${DELIVERY_PARTNER_BASE_PATH}${encodeURIComponent(id)}`,
      buildFormData(payload),
      {
        headers: buildHeaders(sessionKey, true),
        validateStatus,
      },
    ),
  );

  return response;
};

export const deleteDeliveryPartner = async (
  id: string,
  sessionKey?: string,
): Promise<void> => {
  if (!id) {
    throw new Error('Delivery partner ID is required');
  }

  await apiCall<any>(
    axiosInstance.delete(
      `${DELIVERY_PARTNER_BASE_PATH}${encodeURIComponent(id)}`,
      {
        headers: buildHeaders(sessionKey),
        validateStatus,
      },
    ),
  );
};

export const deliveryPartnerService = {
  fetchDeliveryPartners,
  fetchOnlineDeliveryPartners,
  fetchDeliveryPartnerById,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
};
