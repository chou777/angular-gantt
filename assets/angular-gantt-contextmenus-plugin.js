/*
Project: angular-gantt v1.2.11 - Gantt chart component for AngularJS
Authors: Marco Schweighauser, Rémi Alvergnat
License: MIT
Homepage: https://www.angular-gantt.com
Github: https://github.com/angular-gantt/angular-gantt.git
*/
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

(function() {
    'use strict';
    angular.module('gantt.contextmenus').directive('ganttContextMenu', ['$log','$timeout', '$compile', '$document', '$templateCache', 'ganttDebounce', 'ganttSmartEvent', function($log, $timeout, $compile, $document, $templateCache, debounce, smartEvent) {
        // This contextmenu displays more information about a task

        return {
            restrict: 'EA',
            scope: true,
            replace: true,
            controller: ['$scope', '$element', 'ganttUtils', '$q', function($scope, $element, utils, $q) {

                var contextMenus = [];
                var $currentContextMenu = null;

                $scope.task.getContentElement().bind('contextmenu', function(evt) {
                    event.stopPropagation();
                    $scope.$apply(function () {
                        event.preventDefault();
                        if ($scope.pluginScope.menuOptions instanceof Array) {
                            if ($scope.pluginScope.menuOptions.length === 0) { return; }
                            renderContextMenu($scope, event, $scope.pluginScope.menuOptions, $scope.task.model);
                        } else {
                            throw '"' + $scope.pluginScope.menuOptions + '" not an array';
                        }
                    });
                });
                var removeContextMenus = function (level) {
                    while (contextMenus.length && (!level || contextMenus.length > level)) {
                        contextMenus.pop().remove();
                    }
                    if (contextMenus.length == 0 && $currentContextMenu) {
                        $currentContextMenu.remove();
                    }
                };
                var renderContextMenu = function ($scope, event, options, model, level) {
                    if (!level) { level = 0; }
                    if (!$) { var $ = angular.element; }
                    $(event.currentTarget).addClass('context');
                    var $contextMenu = $('<div>');
                    if ($currentContextMenu) {
                        $contextMenu = $currentContextMenu;
                    } else {
                        $currentContextMenu = $contextMenu;
                    }
                    $contextMenu.addClass('dropdown clearfix');
                    var $ul = $('<ul>');
                    $ul.addClass('dropdown-menu');
                    $ul.attr({ 'role': 'menu' });
                    $ul.css({
                        display: 'block',
                        position: 'absolute',
                        left: event.pageX + 'px',
                        top: event.pageY + 'px',
                        "z-index": 10000
                    });
                    angular.forEach(options, function (item, i) {
                        var $li = $('<li>');
                        if (item === null) {
                            $li.addClass('divider');
                        } else {
                            var nestedMenu = angular.isArray(item[1])
                              ? item[1] : angular.isArray(item[2])
                              ? item[2] : angular.isArray(item[3])
                              ? item[3] : null;
                            var $a = $('<a>');
                            $a.css("padding-right", "8px");
                            $a.attr({ tabindex: '-1', href: '#' });
                            var text = typeof item[0] == 'string' ? item[0] : item[0].call($scope, $scope, event, model);
                            $q.when(text).then(function (text) {
                                $a.text(text);
                                if (nestedMenu) {
                                    $a.css("cursor", "default");
                                    $a.append($('<strong style="font-family:monospace;font-weight:bold;float:right;">&gt;</strong>'));
                                }
                            });
                            $li.append($a);

                            var enabled = angular.isFunction(item[2]) ? item[2].call($scope, $scope, event, model, text) : true;
                            if (enabled) {
                                var openNestedMenu = function ($event) {
                                    removeContextMenus(level + 1);
                                    var ev = {
                                        pageX: event.pageX + $ul[0].offsetWidth - 1,
                                        pageY: $ul[0].offsetTop + $li[0].offsetTop - 3
                                    };
                                    renderContextMenu($scope, ev, nestedMenu, model, level + 1);
                                }
                                $li.on('click', function ($event) {
                                    $event.preventDefault();
                                    $scope.$apply(function () {
                                        if (nestedMenu) {
                                            openNestedMenu($event);
                                        } else {
                                            $(event.currentTarget).removeClass('context');
                                            removeContextMenus();
                                            item[1].call($scope, $scope, event, model, text);
                                        }
                                    });
                                });

                                $li.on('mouseover', function ($event) {
                                    $scope.$apply(function () {
                                        if (nestedMenu) {
                                            openNestedMenu($event);
                                        }
                                    });
                                });
                            } else {
                                $li.on('click', function ($event) {
                                    $event.preventDefault();
                                });
                                $li.addClass('disabled');
                            }
                        }
                        $ul.append($li);
                    });
                    $contextMenu.append($ul);
                    var height = Math.max(
                        document.body.scrollHeight, document.documentElement.scrollHeight,
                        document.body.offsetHeight, document.documentElement.offsetHeight,
                        document.body.clientHeight, document.documentElement.clientHeight
                    );
                    $contextMenu.css({
                        width: '100%',
                        height: height + 'px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 9999
                    });
                    $(document).find('body').append($contextMenu);
                    $contextMenu.on("mousedown", function (e) {
                        if ($(e.target).hasClass('dropdown')) {
                            $(event.currentTarget).removeClass('context');
                            removeContextMenus();
                        }
                    }).on('contextmenu', function (event) {
                        $(event.currentTarget).removeClass('context');
                        event.preventDefault();
                        removeContextMenus(level);
                    });
                    $scope.$on("$destroy", function () {
                        removeContextMenus();
                    });

                    contextMenus.push($ul);
                };


                $scope.gantt.api.directives.raise.new('ganttContextMenu', $scope, $element);
                $scope.$on('$destroy', function() {
                    $scope.gantt.api.directives.raise.destroy('ganttContextMenu', $scope, $element);
                });
            }]
        };
    }]);
}());

angular.module('gantt.contextmenus.templates', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('plugins/contextmenus/contextmenu.tmpl.html',
        '<div ng-cloak\n' +
        '     class="gantt-task-info"\n' +
        '     ng-show="displayed"\n' +
        '     ng-class="isRightAligned ? \'gantt-task-infoArrowR\' : \'gantt-task-infoArrow\'"\n' +
        '     ng-style="{top: taskRect.top + \'px\', marginTop: -elementHeight - 8 + \'px\'}">\n' +
        '    <div class="gantt-task-info-content">\n' +
        '        <div gantt-bind-compile-html="pluginScope.content"></div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '');
}]);

//# sourceMappingURL=angular-gantt-contextmenus-plugin.js.map