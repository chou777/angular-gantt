(function(){
    'use strict';
    angular.module('gantt.contextmenus', ['gantt', 'gantt.contextmenus.templates']).directive('ganttContextMenus', ['$compile', '$document', function($compile, $document) {
        return {
            restrict: 'E',
            require: '^gantt',
            scope: {
                enabled: '=?',
                menuOptions: '=?'
            },
            link: function(scope, element, attrs, ganttCtrl) {
                var api = ganttCtrl.gantt.api;

                // Load options from global options attribute.
                if (scope.options && typeof(scope.options.contextmenus) === 'object') {
                    for (var option in scope.options.contextmenus) {
                        scope[option] = scope.options[option];
                    }
                }

                if (scope.enabled === undefined) {
                    scope.enabled = true;
                }

                scope.api = api;

                api.directives.on.new(scope, function(directiveName, taskScope, taskElement) {
                    if (directiveName === 'ganttTask') {

                        var contextmenuScope = taskScope.$new();
                        contextmenuScope.pluginScope = scope;

                        var ifElement = $document[0].createElement('div');
                        angular.element(ifElement).attr('data-ng-if', 'pluginScope.enabled');

                        var contextmenuElement = $document[0].createElement('gantt-context-menu');

                        angular.element(ifElement).append(contextmenuElement);
                        taskElement.append($compile(ifElement)(contextmenuScope));
                    }
                });
            }
        };
    }]);
}());
