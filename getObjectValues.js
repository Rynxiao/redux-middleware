let school = {
	name: 'Hope middle school',
	created: '2001',
	classes: [
		{
			name: '三年二班',
			teachers: [
				{ name: '张二蛋', age: 26, sex: '男', actor: '班主任' },
				{ name: '王小妞', age: 23, sex: '女', actor: '英语老师' }
			]
		},
		{
			name: '明星班',
			teachers: [
				{ name: '欧阳娜娜', age: 29, sex: '女', actor: '班主任' },
				{ name: '李易峰', age: 28, sex: '男', actor: '体育老师' },
				{ name: '杨幂', age: 111, sex: '女', actor: '艺术老师' }
			]
		}
	]
};

function print() {
	console.log.apply(console, arguments);
}

// print(school.classes[0].teachers[0].name);

// var teachName = school.classes[0] && school.classes[0].teachers[1] && school.classes[0].teachers[1].name;
// print(teachName);
school.classes &&
school.classes[0] &&
school.classes[0].teachers &&
school.classes[0].teachers[0] &&
school.classes[0].teachers[0].name

const get = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
print(get(['classes', 0, 'teachers', 0, 'name'], school));

let arr = [1, 2, 3, 4, 5];
let sum = arr.reduce((p, c) => p + c, 10);	// 25

var sum2 = arr.reduce(function(p, c) {
  	print(p);
  	return p + c;
});
print(sum);
print(sum2);