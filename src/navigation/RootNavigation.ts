import {CommonActions, createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

let pendingOrderId: string | null = null;

const navigateToOrderInternal = (orderId: string) => {
  if (!orderId || !navigationRef.isReady()) {
    return;
  }

  // Ensure Home tab is focused first, then route to nested stack screen.
  navigationRef.dispatch(CommonActions.navigate('Home'));

  setTimeout(() => {
    if (!navigationRef.isReady()) {
      pendingOrderId = orderId;
      return;
    }

    navigationRef.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'ViewOrder',
          params: {orderId},
        },
      }),
    );
  }, 50);
};

export const openViewOrderFromNotification = (orderId?: string) => {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId) {
    return;
  }

  if (navigationRef.isReady()) {
    pendingOrderId = null;
    navigateToOrderInternal(normalizedOrderId);
    return;
  }

  pendingOrderId = normalizedOrderId;
};

export const onRootNavigationReady = () => {
  if (!pendingOrderId) {
    return;
  }

  const orderIdToOpen = pendingOrderId;
  pendingOrderId = null;
  navigateToOrderInternal(orderIdToOpen);
};
