/**
 * @author Milad Naseri (mmnaseri@programmer.net)
 * @since 1.0 (4/21/16)
 */
(function () {
    var templates = {
        picker: "$/proton/multi-list-picker/picker.html"
    };
    var module = angular.module('proton.multi-list-picker', []);
    module.run(['$templateCache', function ($templateCache) {
        $templateCache.put(templates.picker, "<div class=\'proton-multi-list-picker {{attachment}}\' mn-touch data-swipe-up=\'swipeUp($event)\'>\n    <span ng-transclude class=\'proton-multi-list-picker-contents\'></span>\n    <div class=\'before\'></div>\n    <ul class=\'lists\'>\n        <li ng-repeat=\'list in items track by $index\' class=\'list-container\'>\n            <span class=\'divider\' ng-if=\'list.$divider\'>\n                <span ng-if=\'!bindHtml\' ng-bind=\'list.$divider\'></span>\n                <span ng-if=\'bindHtml\' ng-bind-html=\'list.$divider\'></span>\n            </span>\n            <ul class=\'list\' ng-if=\'!list.$divider\' ng-init=\'cached = (list.source() | protonMultiListArrayOf); selectedIndex = selected(list.alias, cached); view = (cached | protonMultiListView:selectedIndex);\'>\n                <li class=\'item {{item.index == selectedIndex ? \"selected\" : \"offset-\" + ($index &gt; 3 ? $index - 3 : 3 - $index)}}\' ng-repeat=\'item in view track by $index\'>\n                    <span ng-if=\'!bindHtml\' ng-bind=\'item.label\'></span>\n                    <span ng-if=\'bindHtml\' ng-bind-html=\'item.label\'></span>\n                </li>\n            </ul>\n        </li>\n    </ul>\n    <div class=\'after\'></div>\n</div>");
    }]);
    module.directive('protonMultiListPicker', ["$parse", "$filter", function ($parse, $filter) {
        var controller = function ProtonMultiListPickerController($scope) {
            $scope.items = [];
            this.addDivider = function (divider) {
                $scope.items.push({
                    $divider: divider
                });
            };
            this.add = function (item) {
                if (!item.alias) {
                    item.alias = $scope.items.length;
                }
                $scope.items.push(item);
            };
        };
        return {
            restrict: "E",
            replace: true,
            templateUrl: templates.picker,
            require: "?ngModel",
            controllerAs: "controller",
            scope: {},
            transclude: true,
            controller: ["$scope", controller],
            link: function ($scope, $element, $attrs, ngModel) {
                var controller = $scope.controller;
                var parentScope = $element.parent().scope();
                $scope.attachment = "bottom";
                $attrs.$observe("attachment", function (attachment) {
                    $scope.attachment = attachment || "bottom";
                });
                $scope.bindHtml = false;
                $attrs.$observe("bindHtml", function (bindHtml) {
                    $scope.bindHtml = bindHtml == "true";
                });
                $scope.model = null;
                $scope.$watch(function () {
                    return $parse($attrs.ngModel)(parentScope);
                }, function (model) {
                    $scope.model = model;
                    angular.forEach($scope.items, function (list) {
                        if (!list.alias) {
                            return;
                        }
                        if (angular.isUndefined(model[list.alias])) {
                            $scope.select(list.alias, $filter("protonMultiListArrayOf")(list.source()), 0);
                        }
                    });
                }, true);
                $scope.value = function (list, index) {
                    if (list.index <= index || index < 0) {
                        return null;
                    }
                    return list[index].value;
                };
                $scope.select = function (property, list, index) {
                    $scope.model[property] = $scope.value(list, index);
                };
                $scope.selected = function (property, list) {
                    var selection = $scope.model[property];
                    var index = -1;
                    angular.forEach(list, function (item, cursor) {
                        if (index > -1) {
                            return;
                        }
                        if (angular.isObject(item) && angular.isDefined(item.value) && selection == item.value) {
                            index = cursor;
                        }
                        if ((!angular.isObject(item) || !angular.isDefined(item.value)) && selection == item) {
                            index = cursor;
                        }
                    });
                    return index > -1 ? index : 0;
                };
                $scope.swipeUp = function (event) {
                    console.log("UP", event);
                };
            }
        };
    }]);
    module.directive('protonMultiListPickerList', [function () {
        var controller = function ProtonMultiListPickerListController($scope) {
            $scope.items = [];
            this.add = function (item) {
                $scope.items.push(item);
            };
        };
        return {
            scope: {
                source: "&?",
                alias: "@?"
            },
            restrict: "E",
            require: "^protonMultiListPicker",
            controller: ["$scope", controller],
            link: function ($scope, $element, $attrs, parent) {
                parent.add({
                    source: function () {
                        return $scope.source && $scope.source() || $scope.items;
                    },
                    alias: $scope.alias
                });
            }
        };
    }]);
    module.directive('protonMultiListPickerDivider', [function () {
        return {
            restrict: "E",
            require: "^protonMultiListPicker",
            link: function ($scope, $element, $attrs, parentController) {
                parentController.addDivider($element.html());
            }
        };
    }]);
    module.directive('protonMultiListPickerListItem', [function () {
        return {
            restrict: "E",
            require: "^protonMultiListPickerList",
            link: function ($scope, $element, $attrs, parent) {
                parent.add({
                    value: $attrs.value || $element.html(),
                    label: $element.html()
                });
            }
        };
    }]);
    module.filter('protonMultiListView', [function () {
        return function (items, index) {
            var pivot = index;
            var from = Math.max(pivot - 3, 0);
            var to = Math.min(pivot + 3, items.length - 1);
            var view = [];
            var i;
            for (i = from; i <= to; i++) {
                view.push({
                    label: items[i].label,
                    value: items[i].value,
                    index: i
                });
            }
            if (items.length >= 7 && view.length < 7) {
                var loop = 7 - view.length;
                if (from == 0) {
                    loop = loop * -1;
                }
                if (loop < 0) {
                    for (i = items.length + loop; i < items.length; i++) {
                        view.splice(i - items.length - loop, 0, {
                            label: items[i].label,
                            value: items[i].value,
                            index: i
                        });
                    }
                } else if (loop > 0) {
                    for (i = 0; i < loop; i++) {
                        view.push({
                            label: items[i].label,
                            value: items[i].value,
                            index: i
                        });
                    }
                }
            } else if (view.length < 7) {
                var cursor = items.length - 1;
                while (pivot < 3) {
                    view.splice(0, 0, items[cursor]);
                    cursor --;
                    if (cursor < 0) {
                        cursor = items.length - 1;
                    }
                    pivot ++;
                }
                cursor = 0;
                while (view.length < 7) {
                    view.push(items[cursor]);
                    cursor ++;
                    if (cursor == items.length) {
                        cursor = 0;
                    }
                }
            }
            return view;
        }
    }]);
    module.filter('protonMultiListArrayOf', [function () {
        return function (items) {
            var result;
            if (angular.isArray(items)) {
                result = [];
                angular.forEach(items, function (item) {
                    if (angular.isObject(item) && angular.isDefined(item.label) && angular.isDefined(item.value)) {
                        result.push(item);
                    } else {
                        result.push({
                            label: item,
                            value: item
                        });
                    }
                });
                return result;
            } else if (angular.isObject(items)) {
                result = [];
                angular.forEach(items, function (value, property) {
                    result.push({
                        value: property,
                        label: value
                    });
                });
                result.sort(function (first, second) {
                    return first.label < second.label ? -1 : 1;
                });
                return result;
            } else {
                return [items];
            }
        }
    }]);
})();