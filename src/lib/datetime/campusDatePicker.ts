import { useMemo } from 'react';
import { useDefaultStyles } from 'react-native-ui-datepicker';

const navigationStyles = {
  button_prev: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 6,
  },
  button_next: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 6,
  },
  button_prev_image: {
    height: 0,
    width: 0,
  },
  button_next_image: {
    height: 0,
    width: 0,
  },
};

const selectorStyles = {
  header: {
    marginBottom: 8,
  },
  month_selector_label: {
    color: '#20242A',
    fontSize: 15,
    fontWeight: '800' as const,
  },
  year_selector_label: {
    color: '#20242A',
    fontSize: 15,
    fontWeight: '800' as const,
  },
  weekday_label: {
    color: '#5F6670',
    fontSize: 11,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
  },
  day_label: {
    color: '#20242A',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  month_label: {
    color: '#20242A',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  year_label: {
    color: '#20242A',
    fontSize: 14,
    fontWeight: '700' as const,
  },
};

/** Popovers use a white surface; always use light picker tokens. */
export function useCampusDatePickerStyles() {
  const baseStyles = useDefaultStyles('light');

  return useMemo(
    () => ({
      ...baseStyles,
      ...navigationStyles,
      ...selectorStyles,
      selected: campusDatePickerBrand.selected,
      selected_label: campusDatePickerBrand.selected_label,
      today: campusDatePickerBrand.today,
      selected_month: campusDatePickerBrand.selected,
      selected_month_label: campusDatePickerBrand.selected_label,
      selected_year: campusDatePickerBrand.selected,
      selected_year_label: campusDatePickerBrand.selected_label,
    }),
    [baseStyles],
  );
}

export const campusDatePickerBrand = {
  selected: {
    backgroundColor: '#FFCC00',
    borderColor: '#FFCC00',
  },
  selected_label: {
    color: '#111111',
    fontWeight: '900' as const,
  },
  today: {
    borderColor: '#FFCC00',
    borderWidth: 1,
  },
};
