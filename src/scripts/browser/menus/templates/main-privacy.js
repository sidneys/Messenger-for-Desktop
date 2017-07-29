import prefs from 'browser/utils/prefs';
import Requestfilter from 'browser/components/requestfilter';

export default {
  label: 'Privacy',
  submenu: Requestfilter.listFilters().map((filter) => ({
    type: 'checkbox',
    label: filter.description,
    checked: prefs.get(`requestfilter:${filter.id}`),
    click (menuItem) {
      prefs.set(`requestfilter:${filter.id}`, menuItem.checked);
      global.application.requestfilter.register();
    }
  }))
};
