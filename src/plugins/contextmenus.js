(function(){
    'use strict';
    angular.module('gantt.contextmenus', ['gantt']).directive('ganttContextMenus', ['$compile', '$document', function($compile, $document) {
        return {
            restrict: 'E',
            require: '^gantt',
            scope: {
                enabled: '=?',
                taskOptions: '=?',
            },
            link: function(scope, element, attrs, ganttCtrl) {
                var api = ganttCtrl.gantt.api;

                // Default true
                if (scope.enabled === undefined) {
                    scope.enabled = true;
                }
                scope.api = api;

                api.directives.on.new(scope, function(directiveName, directiveScope, element) {
                    if (directiveName === 'ganttTask' && scope.taskOptions != undefined) {
                        scope.menuList = scope.taskOptions;
                        scope.directiveName = directiveName;
                        var contextmenuScope = directiveScope.$new();
                        contextmenuScope.pluginScope = scope;

                        var ifElement = $document[0].createElement('div');
                        angular.element(ifElement).attr('data-ng-if', 'pluginScope.enabled');

                        var contextmenuElement = $document[0].createElement('gantt-context-menu');

                        angular.element(ifElement).append(contextmenuElement);
                        element.append($compile(ifElement)(contextmenuScope));
                    }
                });
            }
        };
    }]);
}());
