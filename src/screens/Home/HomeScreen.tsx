import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import OrderStackNavigator from '../../navigation/DashboardNavigation';
import CampusSelector from '../../components/common/addressHeader';

const HomeScreen = () => {
  const handleCampusSelect = (campus: any) => {
    console.log('Selected campus:app stack', campus);
  };

  return (
    <View style={styles.container}>
      <View style={styles.gradientWrapper}>
        <LinearGradient
          colors={['#A49EF4', '#A49EF4', 'transparent']}
          start={{x: 0.5, y: 0}}
          end={{x: 0.5, y: 1}}
          style={styles.backgroundGradient}
        />
        <LinearGradient
          colors={['transparent', '#A49EF4', 'transparent']}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={styles.sideFadeLeft}
        />

        <LinearGradient
          colors={['#A49EF4', 'transparent', 'transparent']}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={styles.sideFadeRight}
        />

        <View style={styles.addressHeader}>
          <CampusSelector onSelect={handleCampusSelect} />
        </View>
      </View>

      <View style={styles.content}>
        <OrderStackNavigator />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gradientWrapper: {
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    height: 100, // adjust height as needed
  },
  sideFadeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    // width: 50, // You can tweak this value for smoother fading
    opacity: 0.5,
  },
  sideFadeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    opacity: 0.5,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    // borderBottomLeftRadius: 200,
    // borderBottomRightRadius: 200,
    opacity: 0.7,
  },
  addressHeader: {
    marginTop: 10, // push CampusSelector slightly down
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
});

export default HomeScreen;
