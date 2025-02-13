import { ListPickerBase, selectedIndexProperty, itemsProperty, ItemsSource } from './list-picker-common';
import { Color } from '../../color';
import { backgroundColorProperty, colorProperty } from '../styling/style-properties';
import { profile } from '../../profiling';

export * from './list-picker-common';

export class ListPicker extends ListPickerBase {
	nativeViewProtected: UIPickerView;
	// tslint:disable-next-line
	private _dataSource: ListPickerDataSource;
	private _delegate: ListPickerDelegateImpl;

	createNativeView() {
		return UIPickerView.new();
	}

	initNativeView() {
		super.initNativeView();
		this.nativeViewProtected.dataSource = this._dataSource = ListPickerDataSource.initWithOwner(new WeakRef(this));
		this._delegate = ListPickerDelegateImpl.initWithOwner(new WeakRef(this));
		this.nativeViewProtected.delegate = this._delegate;
	}

	public disposeNativeView() {
		this._dataSource = null;
		this._delegate = null;
		super.disposeNativeView();
	}

	// @ts-ignore
	get ios() {
		return this.nativeViewProtected;
	}

	[selectedIndexProperty.getDefault](): number {
		return -1;
	}
	[selectedIndexProperty.setNative](value: number) {
		if (value >= 0) {
			this.ios.selectRowInComponentAnimated(value, 0, false);
		}
	}

	[itemsProperty.getDefault](): any[] {
		return null;
	}
	[itemsProperty.setNative](value: any[] | ItemsSource) {
		this.ios.reloadAllComponents();

		// Coerce selected index after we have set items to native view.
		selectedIndexProperty.coerce(this);
	}

	[backgroundColorProperty.getDefault](): UIColor {
		return this.ios.backgroundColor;
	}
	[backgroundColorProperty.setNative](value: UIColor | Color) {
		this.ios.backgroundColor = value instanceof Color ? value.ios : value;
	}

	[colorProperty.getDefault](): UIColor {
		return this.ios.tintColor;
	}
	[colorProperty.setNative](value: UIColor | Color) {
		this.ios.tintColor = value instanceof Color ? value.ios : value;
	}
}

@NativeClass
class ListPickerDataSource extends NSObject implements UIPickerViewDataSource {
	public static ObjCProtocols = [UIPickerViewDataSource];

	private _owner: WeakRef<ListPicker>;

	public static initWithOwner(owner: WeakRef<ListPicker>): ListPickerDataSource {
		const dataSource = <ListPickerDataSource>ListPickerDataSource.new();
		dataSource._owner = owner;

		return dataSource;
	}

	public numberOfComponentsInPickerView(pickerView: UIPickerView) {
		return 1;
	}

	public pickerViewNumberOfRowsInComponent(pickerView: UIPickerView, component: number) {
		const owner = this._owner?.deref();

		return owner && owner.items ? owner.items.length : 0;
	}
}

@NativeClass
class ListPickerDelegateImpl extends NSObject implements UIPickerViewDelegate {
	public static ObjCProtocols = [UIPickerViewDelegate];

	private _owner: WeakRef<ListPicker>;

	public static initWithOwner(owner: WeakRef<ListPicker>): ListPickerDelegateImpl {
		const delegate = <ListPickerDelegateImpl>ListPickerDelegateImpl.new();
		delegate._owner = owner;

		return delegate;
	}

	public pickerViewAttributedTitleForRowForComponent(pickerView: UIPickerView, row: number, component: number): NSAttributedString {
		const owner = this._owner?.deref();
		if (owner) {
			const title = NSAttributedString.alloc().initWithStringAttributes(owner._getItemAsString(row), <any>{ [NSForegroundColorAttributeName]: pickerView.tintColor });

			return title;
		}

		return NSAttributedString.alloc().initWithStringAttributes(row.toString(), <any>{ [NSForegroundColorAttributeName]: pickerView.tintColor });
	}

	public pickerViewDidSelectRowInComponent(pickerView: UIPickerView, row: number, component: number): void {
		const owner = this._owner?.deref();
		if (owner) {
			selectedIndexProperty.nativeValueChange(owner, row);
			owner.updateSelectedValue(row);
		}
	}
}
