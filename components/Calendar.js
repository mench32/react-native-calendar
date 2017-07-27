import React, { Component, PropTypes } from 'react';
import {
	Dimensions,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
	Animated
} from 'react-native';

import Day from './Day';

import moment from 'moment';
import styles from './styles';
let test = 0
const DEVICE_WIDTH = Dimensions.get('window').width;
const VIEW_INDEX = 2;

function getNumberOfWeeks(month, weekStart) {
	const firstDay = moment(month).startOf('month').day();
	const offset = (firstDay - weekStart + 7) % 7;
	const days = moment(month).daysInMonth();
	return Math.ceil((offset + days) / 7);
}

export default class Calendar extends Component {

	state = {
		currentMoment: moment(this.props.startDate),
		selectedMoment: moment(this.props.selectedDate),
		rowHeight: null,
		height: new Animated.Value(40)
	};

	static propTypes = {
		currentMonth: PropTypes.any,
		customStyle: PropTypes.object,
		dayHeadings: PropTypes.array,
		eventDates: PropTypes.array,
		monthNames: PropTypes.array,
		nextButtonText: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.object
		]),
		onDateSelect: PropTypes.func,
		onSwipeNext: PropTypes.func,
		onSwipePrev: PropTypes.func,
		onTouchNext: PropTypes.func,
		onTouchPrev: PropTypes.func,
		onTitlePress: PropTypes.func,
		prevButtonText: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.object
		]),
		removeClippedSubviews: PropTypes.bool,
		scrollEnabled: PropTypes.bool,
		selectedDate: PropTypes.any,
		showControls: PropTypes.bool,
		showEventIndicators: PropTypes.bool,
		startDate: PropTypes.any,
		titleFormat: PropTypes.string,
		today: PropTypes.any,
		weekStart: PropTypes.number,
		calendarFormat: PropTypes.string
	};

	static defaultProps = {
		customStyle: {},
		width: DEVICE_WIDTH,
		dayHeadings: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
		eventDates: [],
		monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
		nextButtonText: 'Next',
		prevButtonText: 'Prev',
		removeClippedSubviews: true,
		scrollEnabled: false,
		showControls: false,
		showEventIndicators: false,
		startDate: moment().format('YYYY-MM-DD'),
		titleFormat: 'MMMM YYYY',
		weekStart: 1,
		calendarFormat: 'monthly' // weekly or monthly
	};

	componentDidMount() {
		setTimeout(() => this.scrollToItem(VIEW_INDEX), 0);
	}

	componentDidUpdate() {
		this.scrollToItem(VIEW_INDEX);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.selectedDate && this.props.selectedDate !== nextProps.selectedDate) {
			this.setState({selectedMoment: nextProps.selectedDate});
		}
		if (nextProps.currentMonth) {
			this.setState({currentMoment: moment(nextProps.currentMonth)});
		}
	}

	getStack(currentMoment) {
		if (this.props.scrollEnabled) {
			let i = -VIEW_INDEX;
			const res = [];

			for (i; i <= VIEW_INDEX; i++) {
				if (this.props.calendarFormat === 'monthly') {
					res.push(moment(currentMoment).add(i, 'month'));
				} else {
					res.push(moment(currentMoment).add(i, 'week'));
				}
			}

			return res;
		}
		return [moment(currentMoment)];
	}

	prepareEventDates(eventDates, events) {
		const parsedDates = {};

		if (events) {
			events.forEach(event => {
				if (event.date) {
					parsedDates[event.date] = event;
				}
			});
		} else {
			eventDates.forEach(event => {
				parsedDates[event] = {};
			});
		}

		return parsedDates;
	}

	selectDate(date) {
		if (this.props.selectedDate === undefined) {
			this.setState({
				selectedMoment: date,
				currentMoment: date
			});
		}
	}

	selectAndJumpToToday() {
		const today = new Date();
		const newMoment = moment(this.state.currentMonthMoment).set('month', today.getMonth());
		this.setState({
			selectedMoment: today,
			currentMonthMoment: newMoment
		});
	}

	onPrev = () => {
		const {calendarFormat} = this.props;
		const {currentMoment} = this.state;
		const newMoment = calendarFormat === 'monthly' ? moment(currentMoment).subtract(1, 'month'): moment(currentMoment).subtract(1, 'week');
		this.setState({ currentMoment: newMoment });
		this.props.onTouchPrev && this.props.onTouchPrev(newMoment);
	};

	onNext = () => {
		const {calendarFormat} = this.props;
		const {currentMoment} = this.state;
		const newMoment = calendarFormat === 'monthly' ? moment(currentMoment).add(1, 'month'): moment(currentMoment).add(1, 'week');
		this.setState({ currentMoment: newMoment });
		this.props.onTouchNext && this.props.onTouchNext(newMoment);
	};

	scrollToItem(itemIndex) {
		const scrollToX = itemIndex * this.props.width;
		if (this.props.scrollEnabled && this._calendar) {
			this._calendar.scrollTo({ y: 0, x: scrollToX, animated: false });
		}
	};

	scrollEnded(event) {
		const {calendarFormat, onSwipePrev, onSwipeNext} = this.props
		const {currentMoment, } = this.state;
		const position = event.nativeEvent.contentOffset.x;
		const currentPage = position / this.props.width;
		const newMoment = calendarFormat === 'monthly' ? moment(currentMoment).add(currentPage - VIEW_INDEX, 'month') : moment(currentMoment).add(currentPage - VIEW_INDEX, 'week');

		this.setState({ currentMoment: newMoment });

		if (currentPage < VIEW_INDEX) {
			onSwipePrev && onSwipePrev(newMoment);
		} else if (currentPage > VIEW_INDEX) {
			onSwipeNext && onSwipeNext(newMoment);
		}
	}

	onWeekRowLayout = (event) => {
		const {calendarFormat, weekStart} = this.props;
		const {currentMoment} = this.state;
		const numOfWeeks = calendarFormat === 'weekly' ? 1 : getNumberOfWeeks(currentMoment, weekStart);
		const rowHeight = event.nativeEvent.layout.height;
		const height = rowHeight * numOfWeeks;
		Animated.timing(
			this.state.height,
			{
				toValue: height,
				duration: 150
			}
		).start();

		this.setState({rowHeight, numOfWeeks});
	};

	getStartMoment(calFormat, currMoment) {
		const weekStart = this.props.weekStart;
		let res;

		if (calFormat === 'monthly') {
			res = moment(currMoment).startOf('month');
		} else {
			// weekly
			let sundayMoment = moment(currMoment).startOf('week');
			if (weekStart > 0) {
				res = moment(currMoment).isoWeekday(weekStart);
				if (res.diff(currMoment) > 0) {
					res = moment(currMoment).subtract(7, 'day').isoWeekday(weekStart);
				}
			} else {
				res = sundayMoment;
			}
		}
		return res;
	}

	renderCalendarView(calFormat, argMoment, eventsMap) {
		let renderIndex = 0,
			weekRows = [],
			days = [];

		const
			startOfArgMoment = this.getStartMoment(calFormat, argMoment),
			selectedMoment = moment(this.state.selectedMoment),
			weekStart = this.props.weekStart,
			todayMoment = moment(this.props.today),
			todayIndex = todayMoment.date() - 1,
			argDaysCount = calFormat === 'monthly' ? argMoment.daysInMonth(): 7,
			offset = calFormat === 'monthly' ? (startOfArgMoment.isoWeekday() - weekStart + 7) % 7: 0,
			selectedIndex = moment(selectedMoment).date() - 1;

		do {
			const dayIndex = renderIndex - offset;
			const isoWeekday = (renderIndex + weekStart) % 7;
			const thisMoment = moment(startOfArgMoment).add(dayIndex, 'day');

			if (dayIndex >= 0 && dayIndex < argDaysCount) {
				days.push((
					<Day
						startOfMonth={startOfArgMoment}
						isWeekend={isoWeekday === 5 || isoWeekday === 6}
						key={`${renderIndex}`}
						onPress={() => {
							this.selectDate(thisMoment);
							this.props.onDateSelect && this.props.onDateSelect(thisMoment ? thisMoment.format(): null );
						}}
						caption={`${thisMoment.format('D')}`}
						isToday={todayMoment.format('YYYY-MM-DD') == thisMoment.format('YYYY-MM-DD')}
						isSelected={selectedMoment.isSame(thisMoment)}
						event={eventsMap[thisMoment.format('YYYY-MM-DD')] || eventsMap[thisMoment.format('YYYYMMDD')]}
						showEventIndicators={this.props.showEventIndicators}
						customStyle={this.props.customStyle}
					/>
				));
			} else {
				days.push(<Day key={`${renderIndex}`} filler customStyle={this.props.customStyle} />);
			}
			if (renderIndex % 7 === 6) {
				weekRows.push(
					<View
						key={weekRows.length}
						onLayout={weekRows.length ? undefined : this.onWeekRowLayout}
						style={[styles.weekRow, this.props.customStyle.weekRow]}
					>
						{days}
					</View>);
				days = [];
				if (dayIndex + 1 >= argDaysCount) {
					break;
				}
			}
			renderIndex += 1;
		} while (true);
		const containerStyle = [styles.monthContainer, this.props.customStyle.monthContainer];
		return <View key={`${startOfArgMoment.format('YYYY-MM-DD')}-${calFormat}`} style={containerStyle}>{weekRows}</View>;
	}

	renderHeading() {
		const {customStyle} = this.props;
		let headings = [];
		let i = 0;

		for (i; i < 7; ++i) {
			const j = (i + this.props.weekStart) % 7;
			headings.push(
				<Text
					key={i}
					style={j === 5 || j === 6 ? [styles.weekendHeading, customStyle.weekendHeading] : [styles.dayHeading, customStyle.dayHeading]}
				>
					{this.props.dayHeadings[j]}
				</Text>
			);
		}

		return <View style={[styles.calendarHeading, this.props.customStyle.calendarHeading]}>{headings}</View>;
	}

	renderTopBar() {
		let localizedMonth = this.props.monthNames[this.state.currentMoment.month()];
		return this.props.showControls
			? (
				<View style={[styles.calendarControls, this.props.customStyle.calendarControls]}>
					<TouchableOpacity
						style={[styles.controlButton, this.props.customStyle.controlButton]}
						onPress={this.onPrev}
					>
						<Text style={[styles.controlButtonText, this.props.customStyle.controlButtonText]}>
							{this.props.prevButtonText}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.title} onPress={() => this.props.onTitlePress && this.props.onTitlePress()}>
						<Text style={[styles.titleText, this.props.customStyle.title]}>
							{localizedMonth} {this.state.currentMoment.year()}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.controlButton, this.props.customStyle.controlButton]}
						onPress={this.onNext}
					>
						<Text style={[styles.controlButtonText, this.props.customStyle.controlButtonText]}>
							{this.props.nextButtonText}
						</Text>
					</TouchableOpacity>
				</View>
			)
			: (
				<View style={[styles.calendarControls, this.props.customStyle.calendarControls]}>
					<Text style={[styles.title, this.props.customStyle.title]}>
						{this.state.currentMoment.format(this.props.titleFormat)}
					</Text>
				</View>
			);
	}

	render() {
		const {eventDates, events, weekStart, calendarFormat, customStyle, removeClippedSubviews, scrollEnabled, titleFormat} = this.props
		const calendarDates = this.getStack(this.state.currentMoment);
		const eventDatesMap = this.prepareEventDates(eventDates, events);

		return (
			<View style={[styles.calendarContainer, customStyle.calendarContainer]}>
				{this.renderTopBar()}
				{this.renderHeading(titleFormat)}
				{
					scrollEnabled
						? <Animated.View
						style={{
							height: this.state.height
						}}
					>
						<ScrollView
							ref={calendar => this._calendar = calendar}
							horizontal
							scrollEnabled
							pagingEnabled
							removeClippedSubviews={removeClippedSubviews}
							scrollEventThrottle={10}
							showsHorizontalScrollIndicator={false}
							automaticallyAdjustContentInsets={false}
							onScroll={(event) => {
								const contentOffset = event.nativeEvent.contentOffset.x - 750;
								const contentWidth = event.nativeEvent.contentSize.width/5;
								const procent = ~~((100/contentWidth) * contentOffset);
								console.log('onScrollBeginDrag', procent, contentWidth, contentOffset)
							}}
							onMomentumScrollEnd={(event) => this.scrollEnded(event)}
						>
							{calendarDates.map((date) => this.renderCalendarView(calendarFormat, moment(date), eventDatesMap))}
						</ScrollView>
					</Animated.View>
						: <View ref={calendar => this._calendar = calendar}>
						{calendarDates.map((date) => this.renderCalendarView(calendarFormat, moment(date), eventDatesMap))}
					</View>}
			</View>
		);
	}
}
