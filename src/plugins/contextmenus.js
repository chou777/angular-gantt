(function(){
    'use strict';
    angular.module('gantt.contextmenus', ['gantt']).directive('ganttContextMenus', ['$compile', '$document', function($compile, $document) {
        return {
            restrict: 'E',
            require: '^gantt',
            scope: {
                enabled: '=?',
                taskOptions: '=?',
                rowLabelOptions: '=?',

            },
            link: function(scope, element, attrs, ganttCtrl) {
                var api = ganttCtrl.gantt.api;

                // Default true
                if (scope.enabled === undefined) {
                    scope.enabled = true;
                }
                scope.api = api;

                api.directives.on.new(scope, function(directiveName, directiveScope, element) {
                    if (directiveName === 'ganttRowLabel' && scope.rowLabelOptions != undefined) {
                        if (element.hasClass('gantt-row-label') && element.hasClass('gantt-row-height')) {
                            if (!element.hasClass('context-menu-enabled')){
                                element.addClass('context-menu-enabled');
                                var contextmenuScope = directiveScope.$new();
                                contextmenuScope.directiveName = directiveName;
                                contextmenuScope.menuList = scope.rowLabelOptions;
                                contextmenuScope.pluginScope = scope;
                                var ifElement = $document[0].createElement('div');
                                angular.element(ifElement).attr('data-ng-if', 'pluginScope.enabled');
                                var contextmenuElement = $document[0].createElement('gantt-context-menu');
                                angular.element(ifElement).append(contextmenuElement);
                                element.append($compile(ifElement)(contextmenuScope));
                            }
                        }
                    }

                    if (directiveName === 'ganttTask' && scope.taskOptions != undefined) {
                        if (!element.hasClass('context-menu-enabled')){
                            element.addClass('context-menu-enabled');
                            var contextmenuScope = directiveScope.$new();
                            contextmenuScope.pluginScope = scope;
                            contextmenuScope.directiveName = directiveName;
                            contextmenuScope.menuList =  scope.taskOptions;
                            var ifElement = $document[0].createElement('div');
                            angular.element(ifElement).attr('data-ng-if', 'pluginScope.enabled');
                            var contextmenuElement = $document[0].createElement('gantt-context-menu');
                            angular.element(ifElement).append(contextmenuElement);
                            element.append($compile(ifElement)(contextmenuScope));
                        }
                    }
                });
            }
        };
    }]);
}());
