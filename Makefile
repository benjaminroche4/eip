.PHONY: start clean

## Lance le projet (serveur PHP + Vite HMR + queue + logs)
start:
	composer run dev

## Vide les caches Laravel (config, routes, routes traduites, vues, events, compiled).
## Le cache applicatif (table `cache` MySQL) est vidé seulement si MAMP tourne.
clean:
	php artisan config:clear
	php artisan route:clear
	php artisan route:trans:clear
	php artisan view:clear
	php artisan event:clear
	php artisan clear-compiled
	-php artisan cache:clear
