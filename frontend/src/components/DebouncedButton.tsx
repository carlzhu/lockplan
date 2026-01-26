import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

interface DebouncedButtonProps extends TouchableOpacityProps {
  onPress?: () => void | Promise<void>;
  debounceTime?: number;
  showLoadingIndicator?: boolean;
  children: React.ReactNode;
}

/**
 * 带防抖功能的按钮组件
 * 防止用户快速多次点击导致重复提交
 */
const DebouncedButton: React.FC<DebouncedButtonProps> = ({
  onPress,
  debounceTime = 1000,
  showLoadingIndicator = true,
  disabled,
  style,
  children,
  ...rest
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePress = useCallback(async () => {
    if (isProcessing || disabled) {
      return;
    }

    setIsProcessing(true);

    try {
      if (onPress) {
        await onPress();
      }
    } catch (error) {
      console.error('Button press error:', error);
    } finally {
      // 延迟重置状态，防止快速连续点击
      setTimeout(() => {
        setIsProcessing(false);
      }, debounceTime);
    }
  }, [onPress, isProcessing, disabled, debounceTime]);

  return (
    <TouchableOpacity
      {...rest}
      style={[style, (isProcessing || disabled) && styles.disabled]}
      onPress={handlePress}
      disabled={isProcessing || disabled}
      activeOpacity={0.7}
    >
      {isProcessing && showLoadingIndicator ? (
        <ActivityIndicator color="#fff" />
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
});

export default DebouncedButton;
